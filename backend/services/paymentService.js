// Payment service to handle different payment integrations
import 'dotenv/config';
import paypal from '@paypal/checkout-server-sdk';
import axios from 'axios';
import db from '../models/index.js';

// PayPal environment setup
function getPayPalEnvironment() {
  if (process.env.NODE_ENV === 'production') {
    return new paypal.core.LiveEnvironment(
      process.env.PAYPAL_CLIENT_ID || '',
      process.env.PAYPAL_CLIENT_SECRET || ''
    );
  }
  return new paypal.core.SandboxEnvironment(
    process.env.PAYPAL_CLIENT_ID || '',
    process.env.PAYPAL_CLIENT_SECRET || ''
  );
}

const paypalClient = new paypal.core.PayPalHttpClient(getPayPalEnvironment());

// PayPal Payment Integration
export async function createPayPalOrder(amount, currency = 'USD', orderId, description = 'Phone Store Order') {
  try {
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [{
        amount: {
          currency_code: currency,
          value: amount.toFixed(2),
        },
        description,
        reference_id: orderId.toString(),
      }],
      application_context: {
        brand_name: 'Phone Store',
        shipping_preference: 'NO_SHIPPING',
        user_action: 'PAY_NOW',
        return_url: `${process.env.FRONTEND_URL}/checkout/success`,
        cancel_url: `${process.env.FRONTEND_URL}/checkout/cancel`,
      },
    });

    const response = await paypalClient.execute(request);
    
    // Extract approval URL and order ID from the response
    const approvalUrl = response.result.links.find(link => link.rel === 'approve').href;
    
    return {
      success: true,
      data: {
        orderId: response.result.id,
        approvalUrl,
      },
    };
  } catch (error) {
    console.error('PayPal order creation error:', error);
    return {
      success: false,
      error: error.message || 'Failed to create PayPal order',
    };
  }
}

export async function capturePayPalPayment(paypalOrderId) {
  try {
    const request = new paypal.orders.OrdersCaptureRequest(paypalOrderId);
    request.requestBody({});
    
    const response = await paypalClient.execute(request);
    
    const captureId = response.result.purchase_units[0].payments.captures[0].id;
    const status = response.result.status;
    const amount = parseFloat(response.result.purchase_units[0].payments.captures[0].amount.value);
    
    return {
      success: true,
      data: {
        transactionId: captureId,
        status: status,
        verified: status === 'COMPLETED',
        amount,
        currency: response.result.purchase_units[0].payments.captures[0].amount.currency_code,
        paymentMethod: 'paypal',
      },
    };
  } catch (error) {
    console.error('PayPal payment capture error:', error);
    return {
      success: false,
      error: error.message || 'Failed to capture PayPal payment',
    };
  }
}

// M-Pesa Payment Integration
export async function initiateMpesaPayment(phoneNumber, amount, orderId, description = 'Phone Store Order') {
  // USD to KES conversion (this should ideally come from a real-time exchange rate API)
  const USD_TO_KES_RATE = 128.5;
  const amountInKES = Math.round(amount * USD_TO_KES_RATE);
  
  // Remove any non-numeric characters and ensure it starts with country code
  phoneNumber = phoneNumber.replace(/\D/g, '');
  if (!phoneNumber.startsWith('254') && phoneNumber.startsWith('0')) {
    phoneNumber = '254' + phoneNumber.substring(1);
  } else if (!phoneNumber.startsWith('254')) {
    phoneNumber = '254' + phoneNumber;
  }

  const timestamp = new Date().toISOString().replace(/[-:\.]/g, '').slice(0, 14);
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  
  // Generate password for the transaction (base64 encoded string of shortcode + passkey + timestamp)
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  
  // Determine API URL based on environment
  const baseUrl = process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
  
  try {
    // First, get the access token
    const authResponse = await axios({
      method: 'get',
      url: `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64')}`,
      },
    });
    
    const accessToken = authResponse.data.access_token;
    
    // Now initiate the STK Push
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/mpesa/stkpush/v1/processrequest`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        TransactionType: 'CustomerPayBillOnline',
        Amount: Math.round(amountInKES),
        PartyA: phoneNumber,
        PartyB: shortcode,
        PhoneNumber: phoneNumber,
        CallBackURL: `${process.env.API_BASE_URL || 'http://localhost:3000'}/api/payments/mpesa/callback`,
        AccountReference: `Order_${orderId}`,
        TransactionDesc: description,
      },
    });
    
    // Save the checkout request ID in our database for callback verification
    await db.Payment.create({
      user_id: null, // Will be updated after callback
      order_id: orderId,
      amount: amount,
      currency: 'USD',
      payment_method: 'mpesa',
      payment_status: 'pending',
      transaction_id: response.data.CheckoutRequestID,
      metadata: {
        phoneNumber,
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        amountInKES: amountInKES
      },
    });
    
    return {
      success: true,
      data: {
        checkoutRequestId: response.data.CheckoutRequestID,
        merchantRequestId: response.data.MerchantRequestID,
        responseDescription: response.data.ResponseDescription,
      },
    };
  } catch (error) {
    console.error('M-Pesa payment initiation error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to initiate M-Pesa payment',
    };
  }
}

export async function verifyMpesaPayment(checkoutRequestId) {
  const timestamp = new Date().toISOString().replace(/[-:\.]/g, '').slice(0, 14);
  const shortcode = process.env.MPESA_SHORTCODE;
  const passkey = process.env.MPESA_PASSKEY;
  
  // Generate password
  const password = Buffer.from(`${shortcode}${passkey}${timestamp}`).toString('base64');
  
  // Determine API URL based on environment
  const baseUrl = process.env.MPESA_ENVIRONMENT === 'production'
    ? 'https://api.safaricom.co.ke'
    : 'https://sandbox.safaricom.co.ke';
  
  try {
    // Get access token
    const authResponse = await axios({
      method: 'get',
      url: `${baseUrl}/oauth/v1/generate?grant_type=client_credentials`,
      headers: {
        'Authorization': `Basic ${Buffer.from(`${process.env.MPESA_CONSUMER_KEY}:${process.env.MPESA_CONSUMER_SECRET}`).toString('base64')}`,
      },
    });
    
    const accessToken = authResponse.data.access_token;
    
    // Query transaction status
    const response = await axios({
      method: 'post',
      url: `${baseUrl}/mpesa/stkpushquery/v1/query`,
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      data: {
        BusinessShortCode: shortcode,
        Password: password,
        Timestamp: timestamp,
        CheckoutRequestID: checkoutRequestId,
      },
    });
    
    const resultCode = response.data.ResultCode;
    const success = resultCode === 0;
    
    // If successful, update the payment record
    if (success) {
      const payment = await db.Payment.findOne({
        where: { transaction_id: checkoutRequestId },
      });
      
      if (payment) {
        await payment.update({
          payment_status: 'completed',
          metadata: {
            ...payment.metadata,
            resultCode,
            resultDesc: response.data.ResultDesc,
          },
        });
        
        // Also update the order status
        const order = await db.Order.findByPk(payment.order_id);
        if (order) {
          await order.update({ order_status: 'paid' });
        }
      }
    }
    
    return {
      success: true,
      data: {
        status: success ? 'completed' : 'failed',
        verified: success,
        resultCode,
        resultDesc: response.data.ResultDesc,
        paymentMethod: 'mpesa',
      },
    };
  } catch (error) {
    console.error('M-Pesa payment verification error:', error.response?.data || error.message);
    return {
      success: false,
      error: error.response?.data?.errorMessage || error.message || 'Failed to verify M-Pesa payment',
    };
  }
}

// Generic function to record payment in our database
export async function recordPayment(userId, orderId, amount, currency, paymentMethod, status, transactionId, metadata = {}) {
  try {
    const payment = await db.Payment.create({
      user_id: userId,
      order_id: orderId,
      amount,
      currency,
      payment_method: paymentMethod,
      payment_status: status,
      transaction_id: transactionId,
      metadata,
    });

    // Update order status if payment is successful
    if (status === 'completed') {
      await db.Order.update(
        { order_status: 'paid' },
        { where: { id: orderId } }
      );
    }

    return {
      success: true,
      data: {
        payment,
      },
    };
  } catch (error) {
    console.error('Error recording payment:', error);
    return {
      success: false,
      error: error.message || 'Failed to record payment',
    };
  }
}
