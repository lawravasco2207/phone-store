# Payment Integration Guide

This guide explains how to set up and use the payment integrations (Stripe, PayPal, and M-Pesa) in the Phone Store application.

## Table of Contents

1. [Environment Setup](#environment-setup)
2. [Backend Implementation](#backend-implementation)
3. [Frontend Implementation](#frontend-implementation)
4. [Testing](#testing)
5. [Troubleshooting](#troubleshooting)

## Environment Setup

Set the following environment variables in your `.env` file:

```
# Stripe API Keys
STRIPE_SECRET_KEY=sk_test_your_stripe_secret_key
STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key

# PayPal API Keys
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret

# M-Pesa API Keys
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=your_mpesa_shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_ENVIRONMENT=sandbox  # sandbox or production
```

For the frontend `.env`, add:

```
VITE_STRIPE_PUBLIC_KEY=pk_test_your_stripe_public_key
```

## Backend Implementation

The payment integration uses the following components:

1. **Payment Service** (`/backend/services/paymentService.js`): Contains all the API integration code for Stripe, PayPal, and M-Pesa.

2. **Payment Routes** (`/backend/routes/payments.js`): API endpoints for handling payment operations:
   - `/api/payments/stripe/*`: Stripe payment processing endpoints
   - `/api/payments/paypal/*`: PayPal payment processing endpoints
   - `/api/payments/mpesa/*`: M-Pesa payment processing endpoints
   - `/api/payments/test/*`: Test endpoints for each payment method

## Frontend Implementation

The frontend uses the following components:

1. **Payment Forms** (`/frontend/src/components/payment/PaymentForms.tsx`): React components for each payment method.

2. **Payment Selector** (`/frontend/src/components/payment/PaymentSelector.tsx`): Component for selecting payment methods and showing the appropriate form.

3. **Checkout Page** (`/frontend/src/pages/Checkout.tsx`): Integrates the payment components into the checkout flow.

## Testing

You can test the payment integrations using the test endpoints:

- `GET /api/payments/test/stripe`: Tests Stripe integration
- `GET /api/payments/test/paypal`: Tests PayPal integration
- `GET /api/payments/test/mpesa`: Tests M-Pesa integration

Automated tests are available in `/backend/tests/payments.test.js`.

## Troubleshooting

### Common Issues

1. **API Key Issues**: Make sure all the required API keys are correctly set in your `.env` files.

2. **Webhook Configuration**: For production, set up webhooks for each payment provider to handle asynchronous payment events.

3. **CORS Issues**: If testing with different frontend/backend URLs, ensure CORS is correctly configured.

4. **Network Errors**: Check your network connection and make sure you can access the payment provider APIs.

### Logging

All payment operations are logged in the database via the audit system. Check the `AuditLog` table for detailed logs of payment operations.

### Support

For issues with specific payment providers:

- Stripe: [Stripe Documentation](https://stripe.com/docs)
- PayPal: [PayPal Developer Documentation](https://developer.paypal.com/docs)
- M-Pesa: [M-Pesa API Documentation](https://developer.safaricom.co.ke/)
