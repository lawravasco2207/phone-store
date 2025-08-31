import { useCart } from '../components/CartContext'
import { formatPrice } from '../utils/format'
import { Link } from 'react-router-dom'
import { type CartItem } from '../utils/api'

export default function Cart() {
  const { 
    items, 
    loading, 
    updateQuantity, 
    removeFromCart, 
    getCartTotal, 
    getCartItemsCount 
  } = useCart()

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-4">Shopping Cart</h1>
          <p className="text-gray-600">Loading cart...</p>
        </div>
      </section>
    )
  }

  if (!items || items.length === 0) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-2xl font-bold mb-8">Shopping Cart</h1>
          <div className="max-w-md mx-auto">
            <div className="text-gray-400 mb-4">
              <svg className="mx-auto h-16 w-16" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3 3h2l.4 2M7 13h10l4-8H5.4m0 0L7 13m0 0l-1.5 6M7 13l-1.5-6M17 13v6a2 2 0 01-2 2H9a2 2 0 01-2-2v-6" />
              </svg>
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Your cart is empty</h2>
            <p className="text-gray-600 mb-6">Add some products to get started!</p>
            <Link to="/products" className="btn-primary">
              Continue Shopping
            </Link>
          </div>
        </div>
      </section>
    )
  }

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-2xl font-bold">Shopping Cart</h1>
          <span className="text-gray-600">
            {getCartItemsCount()} {getCartItemsCount() === 1 ? 'item' : 'items'}
          </span>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart Items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items && items.map((item) => (
                <CartItem
                  key={item.id}
                  item={item}
                  onUpdateQuantity={updateQuantity}
                  onRemove={removeFromCart}
                />
              ))}
            </div>
          </div>

          {/* Order Summary */}
          <div className="lg:col-span-1">
            <div className="bg-gray-50 rounded-lg p-6 sticky top-4">
              <h2 className="text-lg font-semibold mb-4">Order Summary</h2>
              
              <div className="space-y-3 mb-4">
                <div className="flex justify-between">
                  <span>Subtotal ({getCartItemsCount()} items)</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
                <div className="flex justify-between">
                  <span>Shipping</span>
                  <span className="text-green-600">Free</span>
                </div>
                <hr />
                <div className="flex justify-between font-semibold text-lg">
                  <span>Total</span>
                  <span>{formatPrice(getCartTotal())}</span>
                </div>
              </div>

              <Link 
                to="/checkout" 
                className="btn-primary w-full text-center block"
              >
                Proceed to Checkout
              </Link>
              
              <Link 
                to="/products" 
                className="btn-outline w-full text-center block mt-3"
              >
                Continue Shopping
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

interface CartItemProps {
  item: CartItem
  onUpdateQuantity: (itemId: number, quantity: number) => Promise<boolean>
  onRemove: (itemId: number) => Promise<boolean>
}

function CartItem({ item, onUpdateQuantity, onRemove }: CartItemProps) {
  const { Product: product } = item
  const imageUrl = product.images && product.images.length > 0 
    ? product.images[0] 
    : '/api/placeholder/200/200'

  const handleQuantityChange = async (newQuantity: number) => {
    if (newQuantity < 1) return
    
    // Check inventory if available
    if (product.inventory !== undefined && newQuantity > product.inventory) {
      alert(`Only ${product.inventory} items available in stock`)
      return
    }
    
    await onUpdateQuantity(item.id, newQuantity)
  }

  const handleRemove = async () => {
    if (confirm('Remove this item from your cart?')) {
      await onRemove(item.id)
    }
  }

  return (
    <div className="flex gap-4 p-4 border border-gray-200 rounded-lg">
      <div className="flex-shrink-0">
        <img
          src={imageUrl}
          alt={product.name}
          className="w-20 h-20 object-cover rounded-lg"
          onError={(e) => {
            e.currentTarget.src = '/api/placeholder/200/200'
          }}
        />
      </div>
      
      <div className="flex-1 min-w-0">
        <h3 className="font-medium text-gray-900 line-clamp-2">
          {product.name}
        </h3>
        <p className="text-lg font-semibold text-blue-600 mt-1">
          {formatPrice(product.price)}
        </p>
        {product.inventory !== undefined && (
          <p className="text-sm text-gray-500">
            {product.inventory > 0 ? `${product.inventory} in stock` : 'Out of stock'}
          </p>
        )}
      </div>
      
      <div className="flex-shrink-0 flex flex-col items-end gap-2">
        <div className="flex items-center gap-2">
          <button
            onClick={() => handleQuantityChange(item.quantity - 1)}
            disabled={item.quantity <= 1}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            -
          </button>
          <span className="w-8 text-center font-medium">{item.quantity}</span>
          <button
            onClick={() => handleQuantityChange(item.quantity + 1)}
            disabled={product.inventory !== undefined && item.quantity >= product.inventory}
            className="w-8 h-8 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            +
          </button>
        </div>
        
        <button
          onClick={handleRemove}
          className="text-red-600 hover:text-red-800 text-sm"
        >
          Remove
        </button>
      </div>
    </div>
  )
}
