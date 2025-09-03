/**
 * CheckoutPage - Now integrated with backend API
 * - One-page checkout with client-side validation and backend processing.
 * - Uses React endpoints for cart and checkout.
 *
 * Best practices:
 * - Validate on both client and server; never trust client-only validation.
 * - Mock payment processing with proper order creation.
 */
import { useMemo, useState, useEffect } from 'react'
import type React from 'react'
import { useCart } from '../components/CartContext'
import { useAuth } from '../components/AuthContext'
import { api, type CartItem as ApiCartItem } from '../utils/api'
import { formatPrice } from '../utils/format'
import { useToast } from '../components/AlertToast'
import PaymentSelector from '../components/payment/PaymentSelector'

type FormState = {
  name: string
  email: string
  address: string
  city: string
  zip: string
  phoneNumber: string
  paymentMethod: 'paypal' | 'mpesa'
  shipping: 'standard' | 'express'
  discountCode: string
}

const initial: FormState = {
  name: '',
  email: '',
  address: '',
  city: '',
  zip: '',
  phoneNumber: '',
  paymentMethod: (import.meta.env.VITE_DEFAULT_PAYMENT_METHOD as 'paypal' | 'mpesa') || 'mpesa',
  shipping: 'standard',
  discountCode: '',
}

export default function CheckoutPage() {
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [backendCartItems, setBackendCartItems] = useState<ApiCartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
  const [checkoutStep, setCheckoutStep] = useState<'shipping' | 'payment'>('shipping')
  const [orderId, setOrderId] = useState<number | null>(null)
  const cart = useCart()
  const { user } = useAuth()
  const { show } = useToast()

  // Load cart from backend
  useEffect(() => {
    const loadCart = async () => {
      if (!user) return
      
      setLoading(true)
      try {
        const response = await api.getCart()
        if (response.success && response.data) {
          setBackendCartItems(response.data.items)
        }
      } catch (error) {
        console.error('Failed to load cart:', error)
      } finally {
        setLoading(false)
      }
    }

    loadCart()
  }, [user])

  // Pre-fill form with user data
  useEffect(() => {
    if (user) {
      setForm(prev => ({
        ...prev,
        name: user.name || '',
        email: user.email || '',
      }))
    }
  }, [user])

  // Calculate totals from backend cart items
  const items = useMemo(() => {
    if (!backendCartItems) return [];
    return backendCartItems.map(item => ({
      qty: item.quantity,
      product: item.Product
    }));
  }, [backendCartItems]);

  const subtotal = items.reduce((sum, x) => sum + x.qty * x.product.price, 0)
  const shippingCost = form.shipping === 'express' ? 24.99 : items.length > 0 ? 8.99 : 0
  
  // Simple promo engine (mock)
  const promo = (() => {
    const code = form.discountCode.trim().toUpperCase()
    if (!code) return { label: '', amount: 0 }
    if (code === 'SAVE10') return { label: 'SAVE10 (10% off)', amount: -(subtotal * 0.10) }
    if (code === 'FREESHIP') return { label: 'FREESHIP (free shipping)', amount: -shippingCost }
    if (code === 'WELCOME15' && subtotal >= 200) return { label: 'WELCOME15 (15% off >= $200)', amount: -(subtotal * 0.15) }
    return { label: 'Invalid code', amount: 0 }
  })()
  
  const total = Math.max(0, subtotal + shippingCost + promo.amount)

  function validate(f: FormState) {
    const e: Partial<Record<keyof FormState, string>> = {}
    if (!f.name.trim()) e.name = 'Name is required'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email)) e.email = 'Valid email required'
    if (!f.address.trim()) e.address = 'Address is required'
    if (!f.city.trim()) e.city = 'City is required'
    if (!/^\d{5}(-\d{4})?$/.test(f.zip)) e.zip = 'ZIP must be 5 digits'
    if (f.paymentMethod === 'mpesa' && !/^(?:254|\+254|0)?(7\d{8})$/.test(f.phoneNumber)) {
      e.phoneNumber = 'Valid Kenyan phone number required for M-Pesa'
    }
    return e
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault()
    
    if (!user) {
      show({ variant: 'error', title: 'Please sign in', message: 'You must be signed in to place an order.' })
      return
    }
    
    if (!items || items.length === 0) {
      show({ variant: 'error', title: 'Cart is empty', message: 'Add items before placing an order.' })
      return
    }
    
    const eMap = validate(form)
    setErrors(eMap)
    
    if (Object.keys(eMap).length === 0) {
      setProcessing(true)
      try {
        // Prepare the payload based on payment method
        let payloadDetails: any = {
          address: form.address,
          city: form.city,
          zip: form.zip
        };
        
        // Add payment method specific fields
        if (form.paymentMethod === 'mpesa') {
          // For M-Pesa, we need the phone number
          payloadDetails.phoneNumber = form.phoneNumber;
          // For testing, generate a mock transaction ID
          if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
            payloadDetails.mpesaTransactionId = `MPESA-TEST-${Date.now()}`;
          }
        } else if (form.paymentMethod === 'paypal') {
          // For PayPal, generate a mock order ID for testing
          if (import.meta.env.DEV || import.meta.env.MODE === 'test') {
            // Use a consistent format that backend will recognize
            payloadDetails.paypalOrderId = `PAYPAL-ORDER-${Date.now()}`;
            console.log("Generated test PayPal order ID:", payloadDetails.paypalOrderId);
          }
        }
        
        console.log("Checkout payload:", {
          paymentMethod: form.paymentMethod,
          ...payloadDetails
        });
        
        // Send the checkout request with appropriate payment details
        const response = await api.checkout(form.paymentMethod, payloadDetails);
        
        if (response && response.success && response.data) {
          console.log("Checkout response:", response.data);
          // Extract the order ID from the response - handle different response formats
          const orderIdFromResponse = response.data.orderId || 
                                    (response.data.order && response.data.order.id);
          
          if (!orderIdFromResponse) {
            console.error("Missing order ID in response:", response.data);
            throw new Error("Missing order ID in response");
          }
          
          console.log("Extracted order ID:", orderIdFromResponse);
          setOrderId(orderIdFromResponse);
          // Move to payment step
          setCheckoutStep('payment');
        } else {
          show({ 
            variant: 'error', 
            title: 'Checkout failed', 
            message: response?.error || 'Failed to create order' 
          });
        }
      } catch (error) {
        console.error('Checkout error:', error)
        show({ 
          variant: 'error', 
          title: 'Checkout failed', 
          message: 'An error occurred while processing your order.' 
        })
      } finally {
        setProcessing(false)
      }
    }
  }

  function set<K extends keyof FormState>(key: K, value: any) {
    setForm((prev) => {
      if (key === 'paymentMethod') {
        console.log(`Setting payment method to: ${value}`);
        return { 
          ...prev, 
          [key]: value as 'paypal' | 'mpesa',
          // If switching to M-Pesa, ensure phone number is required in validation
          phoneNumber: value === 'mpesa' ? prev.phoneNumber : ''
        };
      }
      return { ...prev, [key]: value };
    });
    
    // Clear any relevant validation errors when changing fields
    if (errors[key]) {
      setErrors(prev => {
        const updated = { ...prev };
        delete updated[key];
        return updated;
      });
    }
  }

  // Handle payment success
  const handlePaymentSuccess = async (data: any) => {
    console.log("Payment success:", data);
    const methodLabel = form.paymentMethod === 'paypal' ? 'PayPal' : 'M‑Pesa';
    const orderIdDisplay = data?.order?.id || orderId || 'Unknown';
    
    show({ 
      variant: 'success', 
      title: `Payment Successful!`, 
      message: `Order #${orderIdDisplay} has been paid. Payment processed via ${methodLabel}.`
    });
    
    // Clear form and refresh cart
    setForm(initial);
    await cart.syncWithBackend();
    setBackendCartItems([]);
    
    // Reset checkout flow
    setCheckoutStep('shipping');
    setOrderId(null);
  }

  // Handle payment error
  const handlePaymentError = (error: string) => {
    show({ 
      variant: 'error', 
      title: 'Payment failed', 
      message: error || 'An error occurred during payment processing.'
    })
  }

  if (!user) {
    return (
      <section>
        <h1 className="text-2xl font-semibold">Checkout</h1>
        <div className="mt-6 text-center py-12">
          <p className="text-gray-600 mb-4">Please sign in to proceed with checkout.</p>
          <button className="btn-primary">Sign In</button>
        </div>
      </section>
    )
  }

  return (
    <section>
      <h1 className="text-2xl font-semibold">Checkout</h1>
      <p className="mt-2 text-sm text-gray-600">Complete your order. Payment is mocked but orders are created.</p>

      {loading ? (
        <div className="mt-6 text-center">
          <div className="inline-flex items-center">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--brand-primary)]"></div>
            <span className="ml-2">Loading cart...</span>
          </div>
        </div>
      ) : checkoutStep === 'shipping' ? (
        <form onSubmit={onSubmit} className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-700">Full name</label>
              <input className="input mt-1 w-full" value={form.name} onChange={(e)=>set('name', e.target.value)} />
              {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-700">Email</label>
              <input type="email" className="input mt-1 w-full" value={form.email} onChange={(e)=>set('email', e.target.value)} />
              {errors.email && <p className="mt-1 text-sm text-red-600">{errors.email}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-700">Address</label>
              <input className="input mt-1 w-full" value={form.address} onChange={(e)=>set('address', e.target.value)} />
              {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address}</p>}
            </div>
            <div>
              <label className="block text-sm text-gray-700">Phone Number (for M-Pesa)</label>
              <input className="input mt-1 w-full" placeholder="07XXXXXXXX or 254XXXXXXXXX" value={form.phoneNumber} onChange={(e)=>set('phoneNumber', e.target.value)} />
              {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm text-gray-700">City</label>
                <input className="input mt-1 w-full" value={form.city} onChange={(e)=>set('city', e.target.value)} />
                {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
              </div>
              <div>
                <label className="block text-sm text-gray-700">ZIP</label>
                <input inputMode="numeric" className="input mt-1 w-full" value={form.zip} onChange={(e)=>set('zip', e.target.value)} />
                {errors.zip && <p className="mt-1 text-sm text-red-600">{errors.zip}</p>}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {/* Payment methods selector (basic) */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment method</label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="pm" checked={form.paymentMethod==='paypal'} onChange={()=>set('paymentMethod','paypal')} />
                  <span>PayPal</span>
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="pm" checked={form.paymentMethod==='mpesa'} onChange={()=>set('paymentMethod','mpesa')} />
                  <span>M‑Pesa</span>
                </label>
              </div>
            </div>
            
            {/* Shipping & discounts */}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700">Shipping</label>
                <select className="select mt-1 w-full" value={form.shipping} onChange={(e)=>set('shipping', e.target.value)}>
                  <option value="standard">Standard (3–5 days) — $8.99</option>
                  <option value="express">Express (1–2 days) — $24.99</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Discount code</label>
                <div className="mt-1 flex gap-2">
                  <input className="input w-full" placeholder="SAVE10 / FREESHIP / WELCOME15" value={form.discountCode} onChange={(e)=>set('discountCode', e.target.value)} />
                  <button type="button" className="btn-outline" onClick={() => {
                    const c = form.discountCode.trim().toUpperCase()
                    if (!c) return
                    const valid = ['SAVE10','FREESHIP','WELCOME15'].includes(c)
                    show({ variant: valid ? 'success' : 'warning', title: valid ? 'Code applied' : 'Invalid code', message: valid ? `${c} applied.` : 'Try SAVE10, FREESHIP, or WELCOME15' })
                  }}>Apply</button>
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border border-[var(--border)] p-4">
              <h2 className="font-medium">Order summary</h2>
              {(!items || items.length === 0) ? (
                <p className="mt-2 text-sm text-gray-600">Your cart is empty.</p>
              ) : (
                <ul className="mt-2 divide-y text-sm">
                  {items.map(({ product, qty }) => (
                    <li key={product.id} className="flex items-center justify-between py-2">
                      <span className="mr-2 line-clamp-1">{qty}× {product.name}</span>
                      <span className="font-medium">{formatPrice(product.price * qty)}</span>
                    </li>
                  ))}
                  <li key="shipping-subtotal" className="flex items-center justify-between pt-3">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </li>
                  <li key="shipping-cost" className="flex items-center justify-between pt-2">
                    <span>Shipping</span>
                    <span className="font-medium">{promo.label.startsWith('FREESHIP') ? formatPrice(0) : formatPrice(shippingCost)}</span>
                  </li>
                  {promo.amount !== 0 && (
                    <li key="shipping-promo" className="flex items-center justify-between pt-2 text-emerald-700">
                      <span>Promo {promo.label}</span>
                      <span className="font-medium">{formatPrice(promo.amount)}</span>
                    </li>
                  )}
                  <li key="shipping-total" className="flex items-center justify-between pt-3 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </li>
                </ul>
              )}
            </div>
            
            {/* Primary submission CTA; disabled state remains distinct without harsh contrast */}
            <button 
              disabled={!items || items.length === 0 || processing} 
              className="btn-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {processing ? 'Processing...' : 'Continue to Payment'}
            </button>
          </div>
        </form>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2">
          <div className="space-y-4">
            <div className="p-4 bg-gray-50 rounded-lg">
              <h3 className="font-medium mb-2">Shipping Details</h3>
              <div className="text-sm">
                <p>{form.name}</p>
                <p>{form.email}</p>
                <p>{form.address}</p>
                <p>{form.city}, {form.zip}</p>
              </div>
              <button 
                onClick={() => setCheckoutStep('shipping')} 
                className="mt-3 text-sm text-blue-600 hover:text-blue-800"
              >
                Edit
              </button>
            </div>
          </div>

          <div className="space-y-4">
            <PaymentSelector
              selectedMethod={form.paymentMethod}
              onMethodChange={(method) => {
                console.log("Payment method changed in parent:", method);
                set('paymentMethod', method);
                // Log additional information when payment method changes
                console.log("Payment method updated. Current order ID:", orderId);
              }}
              amount={total}
              orderId={orderId!}
              phoneNumber={form.phoneNumber}
              onPaymentSuccess={handlePaymentSuccess}
              onPaymentError={handlePaymentError}
            />
            
            <div className="rounded-lg border border-[var(--border)] p-4">
              <h2 className="font-medium">Order summary</h2>
              {(!items || items.length === 0) ? (
                <p className="mt-2 text-sm text-gray-600">Your cart is empty.</p>
              ) : (
                <ul className="mt-2 divide-y text-sm">
                  <li key="payment-subtotal" className="flex items-center justify-between pt-2">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </li>
                  <li key="payment-shipping" className="flex items-center justify-between pt-2">
                    <span>Shipping</span>
                    <span className="font-medium">{promo.label.startsWith('FREESHIP') ? formatPrice(0) : formatPrice(shippingCost)}</span>
                  </li>
                  {promo.amount !== 0 && (
                    <li key="payment-promo" className="flex items-center justify-between pt-2 text-emerald-700">
                      <span>Promo {promo.label}</span>
                      <span className="font-medium">{formatPrice(promo.amount)}</span>
                    </li>
                  )}
                  <li key="payment-total" className="flex items-center justify-between pt-3 text-base font-semibold">
                    <span>Total</span>
                    <span>{formatPrice(total)}</span>
                  </li>
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
