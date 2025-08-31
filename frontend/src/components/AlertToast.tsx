/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { SlideUpTransition } from './Transition'

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
      {/* Visual layer: fixed portal-like container at bottom on mobile, bottom-right on desktop */}
      <div
        className="pointer-events-none fixed inset-x-0 bottom-0 z-[1000] flex flex-col items-stretch gap-3 p-4 sm:inset-auto sm:bottom-6 sm:right-6 sm:w-96"
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
    <SlideUpTransition show={true} duration={400} className="w-full">
      <div 
        className={`pointer-events-auto overflow-hidden rounded-lg shadow-lg ${color} text-white w-full max-w-full`}
      >
        <div className="flex items-start gap-3 p-4">
          {/* Icon indicators for toast types */}
          <div className="shrink-0 pt-0.5">
            {toast.variant === 'success' && (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            )}
            {toast.variant === 'error' && (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            )}
            {toast.variant === 'warning' && (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            )}
            {toast.variant === 'info' && (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          
          <div className="flex-1">
            {toast.title && <p className="font-semibold leading-5">{toast.title}</p>}
            <p className="text-base/5 sm:text-sm/5 opacity-95">{toast.message}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-md p-1.5 hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white h-8 w-8 flex items-center justify-center"
            aria-label="Dismiss notification"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </SlideUpTransition>
  )
}

export default ToastProvider
