import { useState, useEffect } from 'react';
import { 
  PayPalPaymentForm, 
  MPesaPaymentForm 
} from './PaymentForms';

type PaymentSelectorProps = {
  selectedMethod: 'paypal' | 'mpesa';
  onMethodChange: (method: 'paypal' | 'mpesa') => void;
  amount: number;
  orderId: number;
  phoneNumber?: string;
  onPaymentSuccess: (data: any) => void;
  onPaymentError: (error: string) => void;
};

export default function PaymentSelector({
  selectedMethod,
  onMethodChange,
  amount,
  orderId,
  phoneNumber = '',
  onPaymentSuccess,
  onPaymentError
}: PaymentSelectorProps) {
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  
  // Log selected method on mount and when it changes
  useEffect(() => {
    console.log("PaymentSelector - Current selected method:", selectedMethod);
  }, [selectedMethod]);

  const handleMethodChange = (method: 'paypal' | 'mpesa') => {
    console.log("Changing payment method to:", method);
    // Only update if the method is actually changing
    if (method !== selectedMethod) {
      // First update the parent component's state
      onMethodChange(method);
      // Then update the local UI state - reset to selection mode
      setShowPaymentForm(false);
    }
  };

  const handleProceedToPayment = () => {
    setShowPaymentForm(true);
  };

  return (
    <div className="mt-4 w-full">
      <h3 className="text-lg font-medium mb-3">Payment Method</h3>
      
      {!showPaymentForm ? (
        <>
          <div className="space-y-2">
            <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'paypal'}
                onChange={() => handleMethodChange('paypal')}
                className="mr-2"
              />
              <div className="flex items-center">
                <span className="mr-2">PayPal</span>
                <img src="/paypal.svg" alt="PayPal" className="h-6 w-16 object-contain" />
              </div>
            </label>
            
            <label className="flex items-center p-3 border rounded-md cursor-pointer hover:bg-gray-50">
              <input
                type="radio"
                name="paymentMethod"
                checked={selectedMethod === 'mpesa'}
                onChange={() => handleMethodChange('mpesa')}
                className="mr-2"
              />
              <div className="flex items-center">
                <span className="mr-2">M-Pesa</span>
                <img src="/mpesa.svg" alt="M-Pesa" className="h-6 w-16 object-contain" />
              </div>
            </label>
          </div>
          
          <button
            onClick={handleProceedToPayment}
            className="btn-primary w-full mt-4"
          >
            Proceed to Payment
          </button>
        </>
      ) : (
        <>
          <div className="mb-4 flex justify-between items-center border-b pb-2">
            <h4 className="font-medium">
              {selectedMethod === 'paypal' 
                ? 'PayPal Payment' 
                : 'M-Pesa Payment'}
            </h4>
            <button
              onClick={() => setShowPaymentForm(false)}
              className="text-sm text-blue-600 hover:text-blue-800 flex items-center"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Change Payment Method
            </button>
          </div>
          
          {selectedMethod === 'paypal' && (
            <PayPalPaymentForm
              amount={amount}
              orderId={orderId}
              onSuccess={onPaymentSuccess}
              onError={onPaymentError}
            />
          )}
          
          {selectedMethod === 'mpesa' && (
            <MPesaPaymentForm
              amount={amount}
              orderId={orderId}
              initialPhoneNumber={phoneNumber}
              onSuccess={onPaymentSuccess}
              onError={onPaymentError}
            />
          )}
        </>
      )}
    </div>
  );
}
