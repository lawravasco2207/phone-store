import express from 'express';
import db from '../models/index.js';
import { authRequired } from '../middleware/auth.js';
import { writeAudit } from '../utils/audit.js';

const router = express.Router();

router.use(authRequired);

// Process checkout and create order
router.post('/', async (req, res) => {
  // First check if required tables exist - do this BEFORE starting a transaction
  let hasInventoryTable = true;
  try {
    await db.sequelize.query('SELECT 1 FROM "Inventories" LIMIT 1');
  } catch (error) {
    console.warn('Inventory table check failed, inventory checks will be skipped:', error.message);
    hasInventoryTable = false;
  }

  // Now start the transaction
  const t = await db.sequelize.transaction();
  try {
    // First get cart items with product details
    const items = await db.CartItem.findAll({
      where: { user_id: req.user.id },
      include: [db.Product],
      transaction: t
    });
    
    // Validate cart has items
    if (!items || !items.length) { 
      await t.rollback(); 
      return res.status(400).json({ success: false, error: 'Cart is empty' }); 
    }

    // Calculate total amount
    const total = items.reduce((sum, it) => sum + Number(it.Product.price) * it.quantity, 0);
    
    // Get payment method from request (default to 'stripe' if not specified)
    const { paymentMethod = 'stripe', paymentIntentId } = req.body;
    
    // Validate payment method is supported
    const validPaymentMethods = ['stripe', 'paypal', 'mpesa'];
    if (!validPaymentMethods.includes(paymentMethod)) {
      await t.rollback();
      return res.status(400).json({ 
        success: false, 
        error: `Invalid payment method. Supported methods: ${validPaymentMethods.join(', ')}` 
      });
    }
    
    // Create order record
    const order = await db.Order.create({
      user_id: req.user.id,
      total_amount: total,
      currency: 'USD',
      order_status: 'pending' // Will be updated after payment confirmation
    }, { transaction: t });

    // Create order items and update inventory
    for (const item of items) {
      await db.OrderItem.create({
        order_id: order.id,
        product_id: item.product_id,
        quantity: item.quantity,
        price_at_purchase: item.Product.price
      }, { transaction: t });
      
      // Only check inventory if we confirmed the table exists
      if (hasInventoryTable) {
        const inventory = await db.Inventory.findOne({ 
          where: { product_id: item.product_id }, 
          transaction: t 
        });
        
        if (inventory) {
          if (inventory.stock_quantity < item.quantity) { 
            await t.rollback(); 
            return res.status(400).json({ success: false, error: 'Insufficient inventory' }); 
          }
          
          await inventory.update({ 
            stock_quantity: inventory.stock_quantity - item.quantity 
          }, { transaction: t });
        }
      }
    }

    // Process payment based on method
    let payment;
    let paymentStatus = 'pending';
    let transactionId = '';
    
    // In a production environment, you would integrate with real payment providers here
    if (paymentMethod === 'stripe') {
      // For Stripe: Verify payment intent was successful
      if (paymentIntentId) {
        // In production: Verify with Stripe API that payment was successful
        // const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
        // const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
        // if (paymentIntent.status === 'succeeded') {
        //   paymentStatus = 'completed';
        //   transactionId = paymentIntentId;
        // }
        
        // Simulating payment verification for now
        paymentStatus = 'completed';
        transactionId = paymentIntentId;
      } else {
        // Return payment intent creation info
        await t.commit();
        return res.status(200).json({ 
          success: true, 
          data: { 
            orderId: order.id,
            requiresPaymentIntent: true
          } 
        });
      }
    } else if (paymentMethod === 'paypal') {
      // For PayPal: Similar verification process
      const { paypalOrderId } = req.body;
      if (paypalOrderId) {
        // In production: Verify with PayPal API
        paymentStatus = 'completed';
        transactionId = paypalOrderId;
      } else {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'PayPal order ID required' });
      }
    } else if (paymentMethod === 'mpesa') {
      // For M-Pesa: Check transaction confirmation
      const { mpesaTransactionId } = req.body;
      if (mpesaTransactionId) {
        // In production: Verify with M-Pesa API
        paymentStatus = 'completed';
        transactionId = mpesaTransactionId;
      } else {
        await t.rollback();
        return res.status(400).json({ success: false, error: 'M-Pesa transaction ID required' });
      }
    }

    // Create payment record
    payment = await db.Payment.create({ 
      user_id: req.user.id, 
      order_id: order.id, 
      amount: total, 
      currency: 'USD', 
      payment_method: paymentMethod, 
      payment_status: paymentStatus, 
      transaction_id: transactionId 
    }, { transaction: t });

    // Update order status based on payment status
    await order.update({ 
      order_status: paymentStatus === 'completed' ? 'paid' : 'pending'
    }, { transaction: t });

    // Clear the cart if payment was successful
    if (paymentStatus === 'completed') {
      await db.CartItem.destroy({ where: { user_id: req.user.id }, transaction: t });
    }
    
    // Record audit log - wrapped in try/catch to prevent it from affecting the transaction
    try {
      await writeAudit(req.user.id, 'checkout', 'Orders', order.id, { 
        total, 
        paymentMethod, 
        paymentStatus 
      });
    } catch (auditError) {
      console.warn('Failed to write audit log:', auditError.message);
    }
    
    // Commit transaction
    await t.commit();
    
    // Return success response
    return res.status(201).json({ 
      success: true, 
      data: { 
        orderId: order.id, 
        payment: { 
          id: payment.id,
          status: payment.payment_status, 
          transactionId: payment.transaction_id 
        } 
      } 
    });
  } catch (error) {
    console.error('Checkout error:', error);
    await t.rollback();
    return res.status(500).json({ success: false, error: 'Checkout failed' });
  }
});

// Get payment methods
router.get('/payment-methods', (req, res) => {
  const paymentMethods = [
    { id: 'stripe', name: 'Credit/Debit Card', icon: 'credit-card' },
    { id: 'paypal', name: 'PayPal', icon: 'paypal' },
    { id: 'mpesa', name: 'M-Pesa', icon: 'mobile' }
  ];
  
  return res.json({ success: true, data: { paymentMethods } });
});

export default router;
