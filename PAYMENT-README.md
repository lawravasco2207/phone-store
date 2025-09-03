# Payment Integration for Phone Store App

This document provides details on the payment integration for the Phone Store e-commerce application.

## Supported Payment Methods

The application currently supports the following payment methods:

1. **PayPal**: For international payments
2. **M-Pesa**: For local payments in Kenya

## Configuration

### Environment Variables

To set up the payment integrations, update the `.env` file in the backend directory with the following variables:

```
# PayPal Configuration
PAYPAL_CLIENT_ID=your_paypal_client_id
PAYPAL_CLIENT_SECRET=your_paypal_client_secret
PAYPAL_MODE=sandbox  # Change to 'live' for production

# M-Pesa Configuration
MPESA_CONSUMER_KEY=your_mpesa_consumer_key
MPESA_CONSUMER_SECRET=your_mpesa_consumer_secret
MPESA_SHORTCODE=174379  # Your M-Pesa shortcode
MPESA_PASSKEY=your_mpesa_passkey
MPESA_ENVIRONMENT=sandbox  # Change to 'production' for live environment
API_BASE_URL=http://localhost:3000  # Your backend API URL
FRONTEND_URL=http://localhost:5173  # Your frontend URL
```

## PayPal Integration

The PayPal integration uses the [PayPal Checkout Server SDK](https://developer.paypal.com/docs/checkout/reference/server-integration/) to create orders and capture payments.

### Flow:

1. Customer selects PayPal payment method
2. System creates a PayPal order with the order details
3. Customer is redirected to PayPal to complete the payment
4. After payment, customer returns to the app
5. System captures the payment and updates the order status

## M-Pesa Integration

The M-Pesa integration uses the [M-Pesa API](https://developer.safaricom.co.ke/docs#/) to initiate and verify payments.

### Flow:

1. Customer selects M-Pesa payment method
2. Customer enters their phone number
3. System initiates an STK push to the customer's phone
4. Customer receives prompt on their phone and enters M-Pesa PIN
5. System verifies the payment status
6. Order status is updated based on the payment result

## Currency Handling

- The application uses USD as the base currency for the store
- For M-Pesa payments, amounts are converted to KES using a fixed exchange rate
- The current exchange rate is set to 128.5 KES per USD

## Testing Payments

### PayPal Sandbox Testing

1. Create a sandbox account at [developer.paypal.com](https://developer.paypal.com)
2. Use the sandbox credentials in your `.env` file
3. Use PayPal sandbox buyer accounts for testing

### M-Pesa Sandbox Testing

1. Register for an M-Pesa sandbox account at [developer.safaricom.co.ke](https://developer.safaricom.co.ke)
2. Use the sandbox credentials in your `.env` file
3. Use test phone numbers like `254708374149` for testing

## Troubleshooting

If you encounter issues with payments:

1. Check the server logs for any errors
2. Verify that your environment variables are correctly set
3. Ensure your PayPal and M-Pesa credentials are valid
4. For M-Pesa, ensure the phone number is in the correct format (starting with 254)

## Support

For further assistance with payment integration, please contact the development team.
