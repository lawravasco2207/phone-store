/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'

type FavoritesContextValue = {
  ids: string[]
  toggle: (id: string) => void
  has: (id: string) => boolean
  clear: () => void
}

const FavoritesContext = createContext<FavoritesContextValue | null>(null)
const STORAGE_KEY = 'phonestore.favorites.v1'

export function FavoritesProvider({ children }: { children: React.ReactNode }) {
  const [ids, setIds] = useState<string[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as string[]) : []
    } catch (e) { console.debug('Favorites load failed', e); return [] }
  })

  useEffect(() => {
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(ids)) } catch (e) { console.debug('Favorites save failed', e) }
  }, [ids])

  const toggle = useCallback((id: string) => {
    setIds((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }, [])
  const has = useCallback((id: string) => ids.includes(id), [ids])
  const clear = useCallback(() => setIds([]), [])

  const value = useMemo<FavoritesContextValue>(() => ({ ids, toggle, has, clear }), [ids, toggle, has, clear])
  return <FavoritesContext.Provider value={value}>{children}</FavoritesContext.Provider>
}

export function useFavorites() {
  const ctx = useContext(FavoritesContext)
  if (!ctx) throw new Error('useFavorites must be used within <FavoritesProvider>')
  return ctx
}

export default FavoritesProvider
