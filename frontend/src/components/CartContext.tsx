import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { api, type Product, type CartItem } from '../utils/api'
import { useAuth } from './AuthContext'

type CartContextValue = {
  items: CartItem[]
  add: (product: Product, qty?: number) => void
  addToCart: (productId: number, quantity: number) => Promise<boolean>
  remove: (id: string) => void
  removeFromCart: (itemId: number) => Promise<boolean>
  setQty: (id: string, qty: number) => void
  updateQuantity: (itemId: number, quantity: number) => Promise<boolean>
  clear: () => void
  loading: boolean
  syncWithBackend: () => Promise<void>
  getCartTotal: () => number
  getCartItemsCount: () => number
}

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)

  // Load initial cart
  useEffect(() => {
    if (user) {
      syncWithBackend()
    } else {
      setItems([])
    }
  }, [user])

  const syncWithBackend = useCallback(async () => {
    if (!user) return
    
    setLoading(true)
    try {
      const response = await api.getCart()
      if (response.success && response.data) {
        setItems(response.data.items)
      }
    } catch (error) {
      console.error('Failed to sync cart with backend:', error)
    } finally {
      setLoading(false)
    }
  }, [user])

  const add = useCallback(async (product: Product, qty = 1) => {
    if (user) {
      await addToCart(product.id, qty)
    }
  }, [user])

  const setQty = useCallback(async (id: string, qty: number) => {
    if (user && items) {
      const backendItem = items.find(item => item.Product.id.toString() === id)
      if (backendItem) {
        if (qty === 0) {
          await removeFromCart(backendItem.id)
        } else {
          await updateQuantity(backendItem.id, qty)
        }
      }
    }
  }, [user, items])

  const remove = useCallback((id: string) => setQty(id, 0), [setQty])
  
  const clear = useCallback(async () => {
    if (user) {
      try {
        if (items && items.length > 0) {
          await Promise.all(
            items.map((item) => api.removeFromCart(item.id))
          )
        }
        await syncWithBackend()
      } catch (error) {
        console.error('Failed to clear backend cart:', error)
      }
    } else {
      setItems([])
    }
  }, [user, items, syncWithBackend])

  const addToCart = useCallback(async (productId: number, quantity: number): Promise<boolean> => {
    try {
      const response = await api.addToCart(productId, quantity)
      if (response.success) {
        await syncWithBackend()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to add to cart:', error)
      return false
    }
  }, [syncWithBackend])

  const removeFromCart = useCallback(async (itemId: number): Promise<boolean> => {
    try {
      const response = await api.removeFromCart(itemId)
      if (response.success) {
        await syncWithBackend()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to remove from cart:', error)
      return false
    }
  }, [syncWithBackend])

  const updateQuantity = useCallback(async (itemId: number, quantity: number): Promise<boolean> => {
    try {
      const response = await api.updateCartItem(itemId, quantity)
      if (response.success) {
        await syncWithBackend()
        return true
      }
      return false
    } catch (error) {
      console.error('Failed to update cart quantity:', error)
      return false
    }
  }, [syncWithBackend])

  const getCartTotal = useCallback((): number => {
    if (!items) return 0;
    return items.reduce((total, item) => {
      return total + (item.Product.price * item.quantity)
    }, 0)
  }, [items])

  const getCartItemsCount = useCallback((): number => {
    if (!items) return 0;
    return items.reduce((total, item) => {
      return total + item.quantity
    }, 0)
  }, [items])

  const value = useMemo<CartContextValue>(() => ({ 
    items, 
    add, 
    addToCart,
    remove, 
    removeFromCart,
    setQty, 
    updateQuantity,
    clear, 
    loading,
    syncWithBackend,
    getCartTotal,
    getCartItemsCount
  }), [items, add, addToCart, remove, removeFromCart, setQty, updateQuantity, clear, loading, syncWithBackend, getCartTotal, getCartItemsCount])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}

export default CartProvider
