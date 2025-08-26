/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import type { Product } from '../utils/mockData'

// Cart item includes product id and quantity; price is read from catalog to avoid duplication
export type CartItem = {
  id: string
  qty: number
}

type CartContextValue = {
  items: CartItem[]
  add: (product: Product, qty?: number) => void
  remove: (id: string) => void
  setQty: (id: string, qty: number) => void
  clear: () => void
}

const CartContext = createContext<CartContextValue | null>(null)

const STORAGE_KEY = 'phonestore.cart.v1'

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartItem[]) : []
    } catch (e) {
      console.debug('Cart load failed', e)
      return []
    }
  })

  // Persist to localStorage on change for a realistic UX
  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(items)) } catch (e) { console.debug('Cart save failed', e) }
  }, [items])

  // Add or increase quantity
  const add = useCallback((product: Product, qty = 1) => {
    setItems((prev) => {
      const ix = prev.findIndex((i) => i.id === product.id)
      if (ix >= 0) {
        const next = [...prev]
        next[ix] = { ...next[ix], qty: Math.min(99, next[ix].qty + qty) }
        return next
      }
      return [...prev, { id: product.id, qty: Math.max(1, Math.min(99, qty)) }]
    })
  }, [])

  // Update quantity or drop when 0
  const setQty = useCallback((id: string, qty: number) => {
    setItems((prev) => {
      const q = Math.max(0, Math.min(99, Math.floor(qty)))
      if (q === 0) return prev.filter((i) => i.id !== id)
      return prev.map((i) => (i.id === id ? { ...i, qty: q } : i))
    })
  }, [])

  const remove = useCallback((id: string) => setItems((prev) => prev.filter((i) => i.id !== id)), [])
  const clear = useCallback(() => setItems([]), [])

  const value = useMemo<CartContextValue>(() => ({ items, add, remove, setQty, clear }), [items, add, remove, setQty, clear])

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>
}

export function useCart() {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used within <CartProvider>')
  return ctx
}

export default CartProvider
