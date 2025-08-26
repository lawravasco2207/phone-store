/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

// Toast message shape: minimal fields for a compact API
export type Toast = {
  id: string // unique id so React can track list items
  title?: string // short title shown bold
  message: string // main text content
  variant?: 'success' | 'info' | 'warning' | 'error' // controls color accents
  duration?: number // auto-dismiss after ms
}

// Context contract: callers can push new toasts from anywhere in the tree
type ToastContextValue = {
  show: (t: Omit<Toast, 'id'>) => string // returns the id for optional manual dismissal
  dismiss: (id: string) => void // allow manual dismissal (e.g., on action click)
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast() {
  // Hook consumers read the context; throw to catch missing provider early
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within <ToastProvider>')
  return ctx
}

// Provider keeps a small queue and renders the visual toast list fixed to a corner
export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]) // local list of active toasts
  const timeouts = useRef(new Map<string, number>()) // track timers to clear on unmount

  // Create a toast id and push it to the list; set up auto-dismiss if duration provided
  const show = useCallback((t: Omit<Toast, 'id'>) => {
    const id = Math.random().toString(36).slice(2)
    const toast: Toast = { id, duration: 3000, variant: 'info', ...t }
    setToasts((prev) => [...prev, toast])
    if (toast.duration && toast.duration > 0) {
      const handle = window.setTimeout(() => {
        setToasts((prev) => prev.filter((x) => x.id !== id))
        timeouts.current.delete(id)
      }, toast.duration)
      timeouts.current.set(id, handle)
    }
    return id
  }, [])

  // Remove a toast and clear any pending timer
  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id))
    const handle = timeouts.current.get(id)
    if (handle) {
      window.clearTimeout(handle)
      timeouts.current.delete(id)
    }
  }, [])

  // Cleanup timers on unmount to avoid leaks
  useEffect(() => {
    const map = timeouts.current
    return () => {
      map.forEach((h) => window.clearTimeout(h))
      map.clear()
    }
  }, [])

  // Memoize value to avoid re-renders downstream
  const value = useMemo<ToastContextValue>(() => ({ show, dismiss }), [show, dismiss])

  return (
    <ToastContext.Provider value={value}>
      {children}
  {/* Visual layer: fixed portal-like container at bottom-right on desktop, full-width on mobile */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[1000] flex flex-col items-stretch gap-2 p-3 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96"
        aria-live="polite" // announce updates for screen readers
        role="status"
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} toast={t} onClose={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  )
}

// Single toast item with slide-in animation and variant-based styles
function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  // Map variant to Tailwind utility classes to keep UI consistent
  // Colors map to theme tokens for a cohesive palette across the app
  const color =
    toast.variant === 'success'
      ? 'bg-[var(--success)]'
      : toast.variant === 'warning'
      ? 'bg-[var(--warning)]'
      : toast.variant === 'error'
      ? 'bg-[var(--error)]'
      : 'bg-[var(--info)]'

  return (
    <div
  className={`pointer-events-auto overflow-hidden rounded-lg shadow-lg transition-all ${color} text-white`} // colorized container via tokens
    >
      <div className="flex items-start gap-3 p-3">
        <div className="flex-1">
          {toast.title && <p className="font-semibold leading-5">{toast.title}</p>}
          <p className="text-sm/5 opacity-95">{toast.message}</p>
        </div>
        <button
          onClick={onClose}
          className="rounded-md p-1 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          aria-label="Dismiss notification"
        >
          ×
        </button>
      </div>
    </div>
  )
}

export default ToastProvider
