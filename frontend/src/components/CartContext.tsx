import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { api, type Product, type CartItem } from '../utils/api'
import { useAuth } from './AuthContext'
import { useAuthPrompt } from './AuthPromptContext'

// Type for guest cart items stored in localStorage
// Guest cart mode has been removed; cart actions require authentication.

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

// No local guest cart storage anymore

const CartContext = createContext<CartContextValue | null>(null)

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  const { requireAuth } = useAuthPrompt()
  const [items, setItems] = useState<CartItem[]>([])
  const [loading, setLoading] = useState(false)
  
  // Guest cart helpers removed

  // Sync cart with backend for logged-in users
  const syncWithBackend = useCallback(async () => {
  if (!user) return;
    
    setLoading(true);
    try {
      const response = await api.getCart();
      if (response.success && response.data) {
        setItems(response.data.items || []);
      }
    } catch (error) {
      console.error('Failed to sync cart with backend:', error);
    } finally {
      setLoading(false);
    }
  }, [user]);

  // Remove item from cart
  const removeFromCart = useCallback(async (itemId: number): Promise<boolean> => {
    try {
      if (!user) { requireAuth(); return false; }
      const response = await api.removeFromCart(itemId);
      if (response.success) {
        setItems(prevItems => prevItems.filter(item => item.id !== itemId));
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to remove from cart:', error);
      return false;
    }
  }, [user, requireAuth]);

  // Update quantity of item in cart
  const updateQuantity = useCallback(async (itemId: number, quantity: number): Promise<boolean> => {
    try {
      if (!user) { requireAuth(); return false; }
      const response = await api.updateCartItem(itemId, quantity);
      if (response.success) {
        const raw: any = (response as any).data;
        const updatedItem: any = raw?.item ?? raw;
        if (updatedItem && typeof updatedItem === 'object' && 'id' in updatedItem) {
          setItems(prevItems => prevItems.map(item => item.id === itemId ? updatedItem : item));
        } else {
          setItems(prevItems => prevItems.map(item => item.id === itemId ? { ...item, quantity } : item));
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to update cart quantity:', error);
      return false;
    }
  }, [user, requireAuth]);
  
  // API-style add to cart (returns promise)
  const addToCart = useCallback(async (productId: number, quantity: number): Promise<boolean> => {
    try {
      if (!user) { requireAuth(); return false; }
      const response = await api.addToCart(productId, quantity);
      if (response.success) {
        const raw: any = (response as any).data;
        const newItem: any = raw?.item ?? raw;
        if (newItem && typeof newItem === 'object' && 'id' in newItem) {
          setItems(prevItems => {
            const ix = prevItems.findIndex(i => i.id === newItem.id);
            if (ix >= 0) { const copy = [...prevItems]; copy[ix] = newItem; return copy; }
            return [...prevItems, newItem];
          });
        } else {
          await syncWithBackend();
        }
        return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to add to cart:', error);
      return false;
    }
  }, [user, requireAuth, syncWithBackend]);

  // Add to cart (simple version for use in components)
  const add = useCallback((product: Product, qty = 1) => {
    if (!product) return;
    
    const idNum = typeof product.id === 'number' ? product.id : typeof product.id === 'string' ? parseInt(product.id) : 0;
    if (!user) { requireAuth(() => addToCart(idNum, qty)); return; }
    addToCart(idNum, qty);
  }, [user, requireAuth, addToCart]);

  // Set quantity of item in cart
  const setQty = useCallback((id: string, qty: number) => {
    if (!user) { requireAuth(); return; }
    const backendItem = items.find(item => String(item.id) === id || String(item.Product.id) === id);
    if (!backendItem) return;
    if (qty <= 0) removeFromCart(backendItem.id); else updateQuantity(backendItem.id, qty);
  }, [user, items, removeFromCart, updateQuantity, requireAuth]);

  // Remove item from cart (shorthand for setQty with 0)
  const remove = useCallback((id: string) => setQty(id, 0), [setQty]);
  
  // Clear entire cart
  const clear = useCallback(async () => {
    if (!user) { requireAuth(); return; }
    try {
      if (items && items.length > 0) {
        await Promise.all(items.map((item) => api.removeFromCart(item.id)));
      }
      await syncWithBackend();
    } catch (error) {
      console.error('Failed to clear backend cart:', error);
    }
  }, [user, items, syncWithBackend, requireAuth]);

  // Get total price of cart
  const getCartTotal = useCallback((): number => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => {
      return total + (item.Product.price * item.quantity);
    }, 0);
  }, [items]);

  // Get total number of items in cart
  const getCartItemsCount = useCallback((): number => {
    if (!items || items.length === 0) return 0;
    return items.reduce((total, item) => {
      return total + item.quantity;
    }, 0);
  }, [items]);

  // Load initial cart when component mounts or user changes
  useEffect(() => {
    if (user) {
      console.log('User authenticated, syncing cart with backend');
      syncWithBackend();
    }
  }, [user, syncWithBackend]);

  // Real-time updates via SSE
  const evtSourceRef = useRef<EventSource | null>(null);
  useEffect(() => {
    // Only subscribe when logged in
    if (!user) {
      if (evtSourceRef.current) { evtSourceRef.current.close(); evtSourceRef.current = null; }
      return;
    }

    // Build base URL respecting proxy/dev configuration
    const base = (import.meta.env.VITE_API_BASE_URL as string) || '/api';
    // Prefer absolute URL when not proxied
    const url = base.startsWith('http') ? `${base}/cart/stream` : `/api/cart/stream`;

    // For cross-origin requests to production, construct URL with auth token to ensure authentication
    // This works around EventSource's limited support for custom headers
    let finalUrl = url;
    if (base.startsWith('http')) {
      const tokenMatch = document.cookie.match(/(?:^|; )token=([^;]+)/);
      if (tokenMatch) {
        const separator = url.includes('?') ? '&' : '?';
        finalUrl = `${url}${separator}auth_token=${encodeURIComponent(tokenMatch[1])}`;
      }
    }

    // Use withCredentials by passing full URL and letting Vite proxy handle cookies
    const es = new EventSource(finalUrl, { withCredentials: true } as any);
    evtSourceRef.current = es;

    const onCart = (ev: MessageEvent) => {
      try {
        const payload = JSON.parse(ev.data || '{}');
        // If change originated from this same session, skip extra fetch; our local state already updated optimistically
        const sidMatch = document.cookie.match(/(?:^|; )sid=([^;]+)/);
        const sid = sidMatch ? decodeURIComponent(sidMatch[1]) : null;
        if (payload?.sessionId && sid && payload.sessionId === sid) return;
      } catch {}
      // Pull latest items
      syncWithBackend();
    };

    es.addEventListener('cart', onCart as any);
    // Optional: resync on reconnect hello
    const onHello = () => syncWithBackend();
    es.addEventListener('hello', onHello as any);

    es.onerror = () => {
      // Browser will auto-retry EventSource; no action needed beyond optional logging
      // console.warn('SSE error, will retry...');
    };

    return () => {
      es.removeEventListener('cart', onCart as any);
      es.removeEventListener('hello', onHello as any);
      es.close();
      evtSourceRef.current = null;
    };
  }, [user, syncWithBackend]);

  // Create value object with all cart functions
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
  }), [items, add, addToCart, remove, removeFromCart, setQty, updateQuantity, clear, loading, syncWithBackend, getCartTotal, getCartItemsCount]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within <CartProvider>');
  return ctx;
}

export default CartProvider;
