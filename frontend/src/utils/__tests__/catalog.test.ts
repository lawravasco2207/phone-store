import { describe, it, expect } from 'vitest'
import { Catalog, filterProducts, sortProducts } from '../mockData'

describe('catalog filters/sorting', () => {
  it('filters by category and min price', () => {
    const res = filterProducts(Catalog.PRODUCTS, { categories: ['Electronics'], price: { min: 500 } })
    expect(res.every(p => p.categories.includes('Electronics') && p.price >= 500)).toBe(true)
  })

  it('sorts by best sellers desc', () => {
    const res = sortProducts(Catalog.PRODUCTS, 'best-sellers')
    for (let i = 1; i < res.length; i++) {
      expect(res[i-1].sales).toBeGreaterThanOrEqual(res[i].sales)
    }
  })
})
