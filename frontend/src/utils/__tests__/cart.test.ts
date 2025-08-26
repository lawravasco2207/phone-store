import { describe, it, expect } from 'vitest'

// simple cart math helpers mirroring CartContext logic without React deps
function add(items: { id: string; qty: number }[], id: string, qty = 1) {
  const ix = items.findIndex(i => i.id === id)
  if (ix >= 0) {
    const next = [...items]
    next[ix] = { ...next[ix], qty: Math.min(99, next[ix].qty + qty) }
    return next
  }
  return [...items, { id, qty: Math.max(1, Math.min(99, qty)) }]
}

function setQty(items: { id: string; qty: number }[], id: string, qty: number) {
  const q = Math.max(0, Math.min(99, Math.floor(qty)))
  if (q === 0) return items.filter(i => i.id !== id)
  return items.map(i => (i.id === id ? { ...i, qty: q } : i))
}

describe('cart math', () => {
  it('adds and increments quantity', () => {
    let items: { id: string; qty: number }[] = []
    items = add(items, 'a', 1)
    items = add(items, 'a', 2)
    expect(items.find(i=>i.id==='a')!.qty).toBe(3)
  })
  it('caps quantity at 99', () => {
    let items = [{ id: 'a', qty: 98 }]
    items = add(items, 'a', 5)
    expect(items.find(i=>i.id==='a')!.qty).toBe(99)
  })
  it('setQty drops items at zero', () => {
    let items = [{ id: 'a', qty: 2 }]
    items = setQty(items, 'a', 0)
    expect(items.length).toBe(0)
  })
})
