// Payment routes for handling PayPal and M-Pesa integrations
import express from 'express';
import db from '../models/index.js';
import { authRequired } from '../middleware/auth.js';
import { writeAudit } from '../utils/audit.js';
import { 
  createPayPalOrder,
  capturePayPalPayment,
  initiateMpesaPayment,
  verifyMpesaPayment,
  recordPayment
} from '../services/paymentService.js';

const router = express.Router();

// Most payment routes should require authentication
router.use(authRequired);

// PayPal payment routes
router.post('/paypal/create-order', async (req, res) => {
  try {
    const { amount, currency = 'USD', orderId, description } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }
    
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }
    
    const result = await createPayPalOrder(amount, currency, orderId, description);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Record audit
    try {
      await writeAudit(req.user.id, 'paypal_order_created', 'Payments', null, { 
        amount, 
        currency,
        paymentMethod: 'paypal',
        order_id: orderId
      });
    } catch (auditError) {
      console.warn('Failed to write audit log:', auditError.message);
    }
    
    return res.json(result);
  } catch (error) {
    console.error('Error creating PayPal order:', error);
    return res.status(500).json({ success: false, error: 'Failed to create PayPal order' });
  }
});

router.post('/paypal/capture', async (req, res) => {
  try {
    const { paypalOrderId, orderId } = req.body;
    
    if (!paypalOrderId) {
      return res.status(400).json({ success: false, error: 'PayPal order ID is required' });
    }
    
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }
    
    // Capture the payment with PayPal
    const capture = await capturePayPalPayment(paypalOrderId);
    
    if (!capture.success || !capture.data.verified) {
      return res.status(400).json({ 
        success: false, 
        error: capture.error || 'Payment capture failed' 
      });
    }
    
    // Record the successful payment in our database
    await recordPayment(
      req.user.id,
      orderId,
      capture.data.amount,
      capture.data.currency,
      'paypal',
      'completed',
      capture.data.transactionId,
      { paypalOrderId, status: capture.data.status }
    );
    
    // Get updated order with payment info
    const order = await db.Order.findByPk(orderId, {
      include: [db.Payment]
    });
    
    // Record audit
    try {
      await writeAudit(req.user.id, 'paypal_payment_captured', 'Payments', null, { 
        amount: capture.data.amount, 
        currency: capture.data.currency,
        paymentMethod: 'paypal',
        order_id: orderId
      });
    } catch (auditError) {
      console.warn('Failed to write audit log:', auditError.message);
    }
    
    return res.json({ 
      success: true, 
      data: { 
        order,
        transactionId: capture.data.transactionId,
        paymentStatus: capture.data.status,
      }
    });
  } catch (error) {
    console.error('Error capturing PayPal payment:', error);
    return res.status(500).json({ success: false, error: 'Failed to capture payment' });
  }
});

// M-Pesa payment routes
router.post('/mpesa/initiate', async (req, res) => {
  try {
    const { phoneNumber, amount, orderId, description } = req.body;
    
    if (!phoneNumber) {
      return res.status(400).json({ success: false, error: 'Phone number is required' });
    }
    
    if (!amount || amount <= 0) {
      return res.status(400).json({ success: false, error: 'Valid amount is required' });
    }
    
    if (!orderId) {
      return res.status(400).json({ success: false, error: 'Order ID is required' });
    }
    
    const result = await initiateMpesaPayment(phoneNumber, amount, orderId, description);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Record audit
    try {
      await writeAudit(req.user.id, 'mpesa_payment_initiated', 'Payments', null, { 
        phoneNumber, 
        amount,
        paymentMethod: 'mpesa',
        order_id: orderId
      });
    } catch (auditError) {
      console.warn('Failed to write audit log:', auditError.message);
    }
    
    return res.json(result);
  } catch (error) {
    console.error('Error initiating M-Pesa payment:', error);
    return res.status(500).json({ success: false, error: 'Failed to initiate M-Pesa payment' });
  }
});

router.post('/mpesa/verify', async (req, res) => {
  try {
    const { checkoutRequestId } = req.body;
    
    if (!checkoutRequestId) {
      return res.status(400).json({ success: false, error: 'Checkout request ID is required' });
    }
    
    const result = await verifyMpesaPayment(checkoutRequestId);
    
    if (!result.success) {
      return res.status(400).json(result);
    }
    
    // Get payment and order details
    const payment = await db.Payment.findOne({
      where: { transaction_id: checkoutRequestId },
      include: [{ model: db.Order }]
    });
    
    return res.json({
      success: true,
      data: {
        ...result.data,
        payment,
      }
    });
  } catch (error) {
    console.error('Error verifying M-Pesa payment:', error);
    return res.status(500).json({ success: false, error: 'Failed to verify M-Pesa payment' });
  }
});

// M-Pesa callback (does not need auth)
router.post('/mpesa/callback', async (req, res) => {
  try {
    const { Body } = req.body;
    
    // Extract relevant data from callback
    const { ResultCode, CheckoutRequestID, ResultDesc } = Body.stkCallback;
    
    // Find the payment record by checkout request ID
    const payment = await db.Payment.findOne({
      where: { transaction_id: CheckoutRequestID }
    });
    
    if (!payment) {
      console.error('Payment not found for checkout request ID:', CheckoutRequestID);
      return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
    }
    
    // Update payment status based on result code
    if (ResultCode === 0) {
      // Payment successful
      await payment.update({
        payment_status: 'completed',
        metadata: {
          ...payment.metadata,
          callbackData: Body.stkCallback,
        }
      });
      
      // Update the order status
      await db.Order.update(
        { order_status: 'paid' },
        { where: { id: payment.order_id } }
      );
      
      // Record audit
      try {
        await writeAudit(payment.user_id, 'mpesa_payment_completed', 'Payments', payment.id, { 
          checkoutRequestId: CheckoutRequestID,
          resultDesc: ResultDesc,
          order_id: payment.order_id
        });
      } catch (auditError) {
        console.warn('Failed to write audit log:', auditError.message);
      }
    } else {
      // Payment failed
      await payment.update({
        payment_status: 'failed',
        metadata: {
          ...payment.metadata,
          callbackData: Body.stkCallback,
          resultCode: ResultCode,
          resultDesc: ResultDesc
        }
      });
      
      // Record audit
      try {
        await writeAudit(payment.user_id, 'mpesa_payment_failed', 'Payments', payment.id, { 
          checkoutRequestId: CheckoutRequestID,
          resultDesc: ResultDesc,
          resultCode: ResultCode,
          order_id: payment.order_id
        });
      } catch (auditError) {
        console.warn('Failed to write audit log:', auditError.message);
      }
    }
    
    // Always return success to M-Pesa to acknowledge receipt
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  } catch (error) {
    console.error('Error processing M-Pesa callback:', error);
    // Still return success to M-Pesa to prevent retries
    return res.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }
});

// Process payment for an existing order using PayPal
router.post('/paypal/process', authRequired, async (req, res) => {
  try {
    const { orderId, paypalOrderId } = req.body;
    
    if (!orderId || !paypalOrderId) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and PayPal Order ID are required'
      });
    }
    
    // Find the order and verify ownership
    const order = await db.Order.findOne({
      where: {
        id: orderId,
        user_id: req.user.id
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or does not belong to you'
      });
    }
    
    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Order is already paid'
      });
    }
    
    // In development/test mode, simulate successful PayPal capture
    // In production, we would call PayPal API to capture the payment
    const captureResult = {
      success: true,
      data: {
        verified: true,
        amount: order.total_amount,
        currency: order.currency || 'USD',
        status: 'completed',
        transactionId: paypalOrderId
      }
    };
    
    // Record the payment in our database
    const paymentResult = await recordPayment(
      req.user.id,
      orderId,
      order.total_amount,
      order.currency || 'USD',
      'paypal',
      'completed',
      paypalOrderId,
      { paypalOrderId, status: 'completed' }
    );
    
    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        error: paymentResult.error || 'Failed to record payment'
      });
    }
    
    const payment = paymentResult.data.payment;
    
    // Update order status
    await order.update({
      payment_status: 'paid',
      order_status: 'processing'
    });
    
    // Record audit
    try {
      await writeAudit(req.user.id, 'paypal_payment_processed', 'Payments', payment.id, {
        amount: order.total_amount,
        currency: order.currency || 'USD',
        paymentMethod: 'paypal',
        order_id: orderId
      });
    } catch (auditError) {
      console.warn('Failed to write audit log:', auditError.message);
    }
    
    return res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          status: 'paid'
        },
        payment: {
          id: payment.id,
          status: 'completed',
          transactionId: paypalOrderId
        }
      }
    });
  } catch (error) {
    console.error('Error processing PayPal payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process PayPal payment'
    });
  }
});

// Process payment for an existing order using M-Pesa
router.post('/mpesa/process', authRequired, async (req, res) => {
  try {
    const { orderId, phoneNumber, mpesaTransactionId } = req.body;
    
    if (!orderId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        error: 'Order ID and Phone Number are required'
      });
    }
    
    // Find the order and verify ownership
    const order = await db.Order.findOne({
      where: {
        id: orderId,
        user_id: req.user.id
      }
    });
    
    if (!order) {
      return res.status(404).json({
        success: false,
        error: 'Order not found or does not belong to you'
      });
    }
    
    // Check if order is already paid
    if (order.payment_status === 'paid') {
      return res.status(400).json({
        success: false,
        error: 'Order is already paid'
      });
    }
    
    // In development/test mode, simulate successful M-Pesa payment
    // In production, we would initiate an STK push and wait for callback
    const transactionId = mpesaTransactionId || `MPESA-TEST-${Date.now()}`;
    
    // Record the payment in our database
    const paymentResult = await recordPayment(
      req.user.id,
      orderId,
      order.total_amount,
      order.currency || 'KES',
      'mpesa',
      'completed',
      transactionId,
      { phoneNumber, status: 'completed' }
    );
    
    if (!paymentResult.success) {
      return res.status(500).json({
        success: false,
        error: paymentResult.error || 'Failed to record payment'
      });
    }
    
    const payment = paymentResult.data.payment;
    
    // Update order status
    await order.update({
      payment_status: 'paid',
      order_status: 'processing'
    });
    
    // Record audit
    try {
      await writeAudit(req.user.id, 'mpesa_payment_processed', 'Payments', payment.id, {
        amount: order.total_amount,
        currency: order.currency || 'KES',
        paymentMethod: 'mpesa',
        phoneNumber,
        order_id: orderId
      });
    } catch (auditError) {
      console.warn('Failed to write audit log:', auditError.message);
    }
    
    return res.json({
      success: true,
      data: {
        order: {
          id: order.id,
          status: 'paid'
        },
        payment: {
          id: payment.id,
          status: 'completed',
          transactionId
        }
      }
    });
  } catch (error) {
    console.error('Error processing M-Pesa payment:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to process M-Pesa payment'
    });
  }
});

// Test routes for each payment integration
router.get('/test/paypal', async (req, res) => {
  try {
    const amount = 10.99;
    const result = await createPayPalOrder(amount, 'USD', 'test_order_123', 'Test Order');
    return res.json(result);
  } catch (error) {
    console.error('Error testing PayPal integration:', error);
    return res.status(500).json({ success: false, error: 'Test failed' });
  }
});

router.get('/test/mpesa', async (req, res) => {
  try {
    // Use a test phone number from the query params or a default one
    const phoneNumber = req.query.phone || '254700000000';
    const amount = 1; // Minimum amount for testing
    const result = await initiateMpesaPayment(phoneNumber, amount, 'test_order_123', 'Test Order');
    return res.json(result);
  } catch (error) {
    console.error('Error testing M-Pesa integration:', error);
    return res.status(500).json({ success: false, error: 'Test failed' });
  }
});

export default router;
