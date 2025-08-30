/**
 * CheckoutPage - Now integrated with backend API
 * - One-page checkout with client-side validation and backend processing.
 * - Uses real backend endpoints for cart and checkout.
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

type FormState = {
  name: string
  email: string
  address: string
  city: string
  zip: string
  card: string
  paymentMethod: 'card' | 'paypal' | 'mpesa'
  shipping: 'standard' | 'express'
  discountCode: string
}

const initial: FormState = {
  name: '',
  email: '',
  address: '',
  city: '',
  zip: '',
  card: '',
  paymentMethod: 'card',
  shipping: 'standard',
  discountCode: '',
}

export default function CheckoutPage() {
  const [form, setForm] = useState<FormState>(initial)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})
  const [backendCartItems, setBackendCartItems] = useState<ApiCartItem[]>([])
  const [loading, setLoading] = useState(false)
  const [processing, setProcessing] = useState(false)
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
    if (f.paymentMethod === 'card') {
      if (!/^\d{12,19}$/.test(f.card.replaceAll(' ', ''))) e.card = 'Card must be 12-19 digits'
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
        const response = await api.checkout(form.paymentMethod, {
          card: form.paymentMethod === 'card' ? form.card : undefined,
          address: form.address,
          city: form.city,
          zip: form.zip,
          shipping: form.shipping,
          discountCode: form.discountCode
        })
        
        if (response && response.success && response.data) {
          const methodLabel = form.paymentMethod === 'card' ? 'Card' : form.paymentMethod === 'paypal' ? 'PayPal' : 'M‑Pesa'
          show({ 
            variant: 'success', 
            title: `Order Placed Successfully!`, 
            message: `Order #${response.data.order.id} received. Total ${formatPrice(response.data.order.total_amount)}. Payment processed via ${methodLabel} (mock).`
          })
          
          // Clear form and refresh cart
          setForm(initial)
          await cart.syncWithBackend()
          setBackendCartItems([])
        } else {
          show({ 
            variant: 'error', 
            title: 'Checkout failed', 
            message: response?.error || 'Failed to process order' 
          })
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

  function set<K extends keyof FormState>(key: K, value: string) {
    setForm((prev) => ({ ...prev, [key]: value }))
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
      ) : (
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
            {/* Payment methods */}
            <div>
              <label className="block text-sm font-medium text-gray-700">Payment method</label>
              <div className="mt-2 space-y-2">
                <label className="flex items-center gap-2 text-sm">
                  <input type="radio" name="pm" checked={form.paymentMethod==='card'} onChange={()=>set('paymentMethod','card')} />
                  <span>Credit/Debit Card</span>
                </label>
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
            
            <div>
              <label className="block text-sm text-gray-700">Card number</label>
              <input inputMode="numeric" disabled={form.paymentMethod!=='card'} className="input mt-1 w-full disabled:bg-gray-100" value={form.card} onChange={(e)=>set('card', e.target.value)} placeholder="4242 4242 4242 4242" />
              {form.paymentMethod==='card' && errors.card && <p className="mt-1 text-sm text-red-600">{errors.card}</p>}
              {form.paymentMethod==='paypal' && (
                <p className="mt-1 text-xs text-gray-600">On submit, you'd be redirected to PayPal (mock).</p>
              )}
              {form.paymentMethod==='mpesa' && (
                <p className="mt-1 text-xs text-gray-600">On submit, an M‑Pesa STK push would be initiated (mock).</p>
              )}
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
                  <li className="flex items-center justify-between pt-3">
                    <span>Subtotal</span>
                    <span className="font-medium">{formatPrice(subtotal)}</span>
                  </li>
                  <li className="flex items-center justify-between pt-2">
                    <span>Shipping</span>
                    <span className="font-medium">{promo.label.startsWith('FREESHIP') ? formatPrice(0) : formatPrice(shippingCost)}</span>
                  </li>
                  {promo.amount !== 0 && (
                    <li className="flex items-center justify-between pt-2 text-emerald-700">
                      <span>Promo {promo.label}</span>
                      <span className="font-medium">{formatPrice(promo.amount)}</span>
                    </li>
                  )}
                  <li className="flex items-center justify-between pt-3 text-base font-semibold">
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
              {processing ? 'Processing...' : 'Place order'}
            </button>
          </div>
        </form>
      )}
    </section>
  )
}
