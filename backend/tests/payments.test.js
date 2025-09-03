import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../models/index.js';

// Mock the payment service functions
vi.mock('../services/paymentService.js', () => ({
  createStripePaymentIntent: vi.fn().mockResolvedValue({
    success: true,
    data: { clientSecret: 'test_secret', paymentIntentId: 'pi_123456' }
  }),
  verifyStripePayment: vi.fn().mockResolvedValue({
    success: true,
    data: { 
      status: 'succeeded', 
      verified: true, 
      amount: 100, 
      currency: 'USD',
      paymentMethod: 'stripe'
    }
  }),
  createPayPalOrder: vi.fn().mockResolvedValue({
    success: true,
    data: { 
      orderId: 'paypal_123456', 
      approvalUrl: 'https://paypal.com/approve'
    }
  }),
  capturePayPalPayment: vi.fn().mockResolvedValue({
    success: true,
    data: { 
      transactionId: 'capture_123456', 
      status: 'COMPLETED', 
      verified: true, 
      amount: 100, 
      currency: 'USD',
      paymentMethod: 'paypal'
    }
  }),
  initiateMpesaPayment: vi.fn().mockResolvedValue({
    success: true,
    data: { 
      checkoutRequestId: 'mpesa_123456', 
      merchantRequestId: 'merchant_123456',
      responseDescription: 'Success'
    }
  }),
  verifyMpesaPayment: vi.fn().mockResolvedValue({
    success: true,
    data: { 
      status: 'completed', 
      verified: true, 
      resultCode: 0,
      resultDesc: 'Success',
      paymentMethod: 'mpesa'
    }
  }),
  recordPayment: vi.fn().mockResolvedValue({
    success: true,
    data: { payment: { id: 1 } }
  })
}));

// Mock the auth middleware
vi.mock('../middleware/auth.js', () => ({
  authRequired: (req, res, next) => {
    req.user = { id: 1, name: 'Test User', email: 'test@example.com' };
    next();
  }
}));

// Mock the audit util
vi.mock('../utils/audit.js', () => ({
  writeAudit: vi.fn().mockResolvedValue({})
}));

describe('Payment Routes', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    
    // Mock DB methods
    db.Order = {
      findByPk: vi.fn().mockResolvedValue({
        id: 1,
        total_amount: 100,
        currency: 'USD',
        order_status: 'pending'
      }),
      update: vi.fn().mockResolvedValue([1])
    };
    
    db.Payment = {
      findOne: vi.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        order_id: 1,
        amount: 100,
        currency: 'USD',
        payment_method: 'stripe',
        payment_status: 'pending',
        transaction_id: 'test_123',
        metadata: {},
        update: vi.fn().mockResolvedValue({})
      }),
      create: vi.fn().mockResolvedValue({
        id: 1,
        user_id: 1,
        order_id: 1,
        amount: 100,
        currency: 'USD',
        payment_method: 'stripe',
        payment_status: 'pending',
        transaction_id: 'test_123'
      })
    };
  });

  describe('Stripe Routes', () => {
    it('should create a payment intent', async () => {
      const response = await request(app)
        .post('/api/payments/stripe/create-intent')
        .send({
          amount: 100,
          currency: 'USD',
          orderId: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('clientSecret');
      expect(response.body.data).toHaveProperty('paymentIntentId');
    });

    it('should confirm a payment', async () => {
      const response = await request(app)
        .post('/api/payments/stripe/confirm')
        .send({
          paymentIntentId: 'pi_123456',
          orderId: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data).toHaveProperty('paymentStatus');
    });
  });

  describe('PayPal Routes', () => {
    it('should create a PayPal order', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/create-order')
        .send({
          amount: 100,
          currency: 'USD',
          orderId: 1,
          description: 'Test Order'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('orderId');
      expect(response.body.data).toHaveProperty('approvalUrl');
    });

    it('should capture a PayPal payment', async () => {
      const response = await request(app)
        .post('/api/payments/paypal/capture')
        .send({
          paypalOrderId: 'paypal_123456',
          orderId: 1
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('order');
      expect(response.body.data).toHaveProperty('transactionId');
      expect(response.body.data).toHaveProperty('paymentStatus');
    });
  });

  describe('M-Pesa Routes', () => {
    it('should initiate an M-Pesa payment', async () => {
      const response = await request(app)
        .post('/api/payments/mpesa/initiate')
        .send({
          phoneNumber: '254712345678',
          amount: 100,
          orderId: 1,
          description: 'Test Order'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('checkoutRequestId');
      expect(response.body.data).toHaveProperty('merchantRequestId');
    });

    it('should verify an M-Pesa payment', async () => {
      const response = await request(app)
        .post('/api/payments/mpesa/verify')
        .send({
          checkoutRequestId: 'mpesa_123456'
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('payment');
      expect(response.body.data).toHaveProperty('status');
      expect(response.body.data).toHaveProperty('verified');
    });
  });

  describe('Test Routes', () => {
    it('should test Stripe integration', async () => {
      const response = await request(app)
        .get('/api/payments/test/stripe');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should test PayPal integration', async () => {
      const response = await request(app)
        .get('/api/payments/test/paypal');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should test M-Pesa integration', async () => {
      const response = await request(app)
        .get('/api/payments/test/mpesa');

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });
});
