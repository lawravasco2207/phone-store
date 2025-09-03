import { useState, useEffect } from 'react';
import type { FormEvent, ReactNode } from 'react';
import { useCart } from '../CartContext';
import type { ApiResponse } from '../../utils/api';
import { convertAndFormatKes } from '../../utils/currency';

// Get API base URL from environment
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '/api';

// Debug log
console.log("API_BASE_URL:", API_BASE_URL);

// Define types for component props
type PaymentFormProps = {
  amount: number;
  orderId: number;
  onSuccess: (data: any) => void;
  onError: (error: string) => void;
};

type MPesaPaymentFormProps = PaymentFormProps & {
  initialPhoneNumber?: string;
};

// Define PayPal response types
interface PayPalOrderData {
  orderId: string;
  approvalUrl: string;
}

// Define M-Pesa response types

interface MPesaVerifyResponseData {
  verified: boolean;
  status?: string;
  resultDesc?: string;
}

// PayPal Payment Component
function PayPalPaymentForm({ amount, orderId, onSuccess, onError }: PaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paypalOrderData, setPaypalOrderData] = useState<PayPalOrderData | null>(null);
  const { syncWithBackend } = useCart();

  useEffect(() => {
    // Simulated PayPal order creation for development/testing
    const createPayPalOrder = async () => {
      try {
        setLoading(true);
        
        // Check if we already have an order ID from the parent component
        console.log("Creating PayPal order for existing order:", { amount, orderId });
        
        // In test/development mode, we'll use a mock PayPal order
        // In production, this would call a dedicated endpoint to create a PayPal order for an existing e-commerce order
        setTimeout(() => {
          // Mock data - this simulates what would come from the PayPal API
          const mockOrderData: PayPalOrderData = {
            orderId: `PAYPAL-ORDER-${Date.now()}`,
            approvalUrl: `https://www.sandbox.paypal.com/checkoutnow?token=MOCK-${Date.now()}`
          };
          
          console.log("Created mock PayPal order:", mockOrderData);
          setPaypalOrderData(mockOrderData);
        }, 1500);
      } catch (err: any) {
        const errorMsg = err.message || 'An error occurred';
        console.error("PayPal order creation error:", errorMsg);
        setError(errorMsg);
        if (onError) onError(errorMsg);
      } finally {
        setLoading(false);
      }
    };

    if (amount > 0 && orderId) {
      createPayPalOrder();
    }
  }, [amount, orderId, onError]);

  const handlePayPalCapture = async () => {
    if (!paypalOrderData?.orderId) return;
    
    try {
      setLoading(true);
      console.log("Capturing PayPal payment for order:", orderId, "PayPal Order ID:", paypalOrderData.orderId);
      
      // In development/test, simulate a successful payment
      // In production, this would call the real payment processing endpoint
      if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
        console.log("Simulating PayPal payment for existing order ID:", orderId);
        
        // Simulate successful payment
        setTimeout(async () => {
          // Clear cart after successful payment
          await syncWithBackend();
          if (onSuccess) onSuccess({
            order: { id: orderId },
            payment: { 
              id: Date.now(),
              status: 'completed',
              transactionId: paypalOrderData.orderId
            }
          });
        }, 1500);
        return;
      }
      
      // Process payment for the existing order using the new API method
      const response = await fetch(`${API_BASE_URL}/payments/paypal/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: orderId,
          paypalOrderId: paypalOrderData.orderId
        }),
      });

      // Parse the response
      const responseData = await response.json() as ApiResponse;
      
      if (responseData.success) {
        // Clear cart after successful payment
        await syncWithBackend();
        if (onSuccess) onSuccess(responseData.data);
      } else {
        setError(responseData.error || 'Payment processing failed');
        if (onError) onError(responseData.error || 'Payment processing failed');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Payment processing failed';
      console.error("PayPal capture error:", errorMsg);
      setError(errorMsg);
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mt-4 w-full">
      {error && (
        <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
          {error}
        </div>
      )}
      
      {paypalOrderData ? (
        <div className="flex flex-col items-center">
          <p className="mb-4 text-center">
            Click the button below to complete your payment with PayPal
          </p>
          <a 
            href={paypalOrderData.approvalUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="mb-4 inline-flex items-center justify-center px-4 py-2 bg-[#0070ba] text-white font-medium rounded hover:bg-[#003087]"
          >
            Pay with PayPal
          </a>
          <button
            onClick={handlePayPalCapture}
            disabled={loading}
            className="btn-outline w-full"
          >
            I've completed PayPal payment
          </button>
          <p className="mt-2 text-xs text-gray-500">
            After completing payment on PayPal, return here and click the button above.
          </p>
        </div>
      ) : (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand-primary)]"></div>
          <span className="ml-2">Initializing PayPal...</span>
        </div>
      )}
    </div>
  );
}

// M-Pesa Payment Component
function MPesaPaymentForm({ amount, orderId, onSuccess, onError, initialPhoneNumber = '' }: MPesaPaymentFormProps) {
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<'initial' | 'processing' | 'checking' | 'success' | 'error'>('initial');
  const [error, setError] = useState<string | null>(null);
  const [phoneNumber, setPhoneNumber] = useState(initialPhoneNumber);
  // Using checkoutRequestId directly in the checkPaymentStatus function
  const { syncWithBackend } = useCart();

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    
    if (!phoneNumber.trim()) {
      setError('Phone number is required');
      return;
    }
    
    try {
      setLoading(true);
      setStatus('processing');
      console.log("Initiating M-Pesa payment for order:", orderId, "Phone:", phoneNumber);
      
      // In development/test, simulate a successful payment
      // In production, this would call the real payment processing endpoint
      if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
        console.log("Simulating M-Pesa payment for existing order ID:", orderId);
        
        // Simulate API call and success response
        setTimeout(() => {
          setStatus('success');
          // Clear cart after successful payment
          syncWithBackend().then(() => {
            if (onSuccess) onSuccess({
              order: { id: orderId },
              payment: { 
                id: Date.now(),
                status: 'completed',
                transactionId: `MPESA-TEST-${Date.now()}`
              }
            });
          });
        }, 3000);
        return;
      }
      
      // Process payment for the existing order using the API
      const response = await fetch(`${API_BASE_URL}/payments/mpesa/process`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          orderId: orderId,
          phoneNumber: phoneNumber
        }),
      });

      // Parse the response
      const responseData = await response.json() as ApiResponse;
      
      if (responseData.success) {
        setStatus('success');
        // Clear cart after successful payment
        await syncWithBackend();
        if (onSuccess) onSuccess(responseData.data);
      } else {
        setError(responseData.error || 'Payment processing failed');
        setStatus('error');
        if (onError) onError(responseData.error || 'Payment processing failed');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'An error occurred';
      console.error("M-Pesa payment error:", errorMsg);
      setError(errorMsg);
      setStatus('error');
      if (onError) onError(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const checkPaymentStatus = async (checkoutRequestId: string) => {
    try {
      // Give a slight delay to allow M-Pesa to process
      await new Promise(resolve => setTimeout(resolve, 5000));
      
      const response = await fetch(`${API_BASE_URL}/payments/mpesa/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          checkoutRequestId,
        }),
      });

      const responseData = await response.json() as ApiResponse;
      
      if (responseData.success) {
        const verifyData = responseData.data as MPesaVerifyResponseData;
        if (verifyData.verified) {
          setStatus('success');
          // Clear cart after successful payment
          await syncWithBackend();
          if (onSuccess) onSuccess(responseData.data);
        } else if (verifyData.status === 'failed') {
          setStatus('error');
          setError('Payment failed: ' + (verifyData.resultDesc || 'Please try again'));
          if (onError) onError('Payment failed: ' + (verifyData.resultDesc || 'Please try again'));
        } else {
          // Still pending, check again
          setTimeout(() => checkPaymentStatus(checkoutRequestId), 5000);
        }
      } else {
        setStatus('error');
        setError(responseData.error || 'Payment verification failed');
        if (onError) onError(responseData.error || 'Payment verification failed');
      }
    } catch (err: any) {
      setStatus('error');
      setError(err.message || 'Payment verification failed');
      if (onError) onError(err.message || 'Payment verification failed');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mt-4 w-full">
      {status === 'initial' || status === 'error' ? (
        <>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              M-Pesa Phone Number
            </label>
            <input
              type="tel"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="e.g., 254712345678"
              className="input w-full"
              disabled={loading}
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter your M-Pesa registered phone number starting with country code (254).
            </p>
          </div>
          {error && (
            <div className="mb-4 p-2 bg-red-50 border border-red-200 rounded text-red-600 text-sm">
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading || !phoneNumber.trim()}
            className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
          >
            {loading ? 'Processing...' : `Pay ${convertAndFormatKes(amount)}`}
          </button>
        </>
      ) : status === 'processing' ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand-primary)] mx-auto mb-3"></div>
          <p>Initiating M-Pesa payment...</p>
          <p className="text-sm text-gray-500 mt-2">Please wait while we initiate the payment.</p>
        </div>
      ) : status === 'checking' ? (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand-primary)] mx-auto mb-3"></div>
          <p>Waiting for M-Pesa payment...</p>
          <p className="text-sm text-gray-500 mt-2">
            Please check your phone for the M-Pesa payment request and enter your PIN.
          </p>
        </div>
      ) : status === 'success' ? (
        <div className="text-center py-4 text-green-600">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <p className="font-medium">Payment Successful!</p>
          <p className="text-sm text-gray-600 mt-2">
            Your M-Pesa payment has been processed successfully.
          </p>
        </div>
      ) : null}
    </form>
  );
}

// Simple provider function for backwards compatibility
export function StripeProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}

export { PayPalPaymentForm, MPesaPaymentForm };
