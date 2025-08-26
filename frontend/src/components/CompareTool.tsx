/**
 * Enhanced CompareTool Component
 * 
 * Features:
 * - Support for both grid and list view modes
 * - Product image previews in comparison table
 * - Export comparison functionality
 * - Share comparison via callback
 * - Responsive design with mobile optimization
 * - Accessibility improvements
 * - Visual highlighting of differences
 * 
 * Design Principles:
 * - Clear product selection interface
 * - Visual emphasis on differing specifications
 * - Mobile-first responsive design
 * - Keyboard navigation support
 * - Screen reader friendly
 */
import { useMemo, useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useToast } from './AlertToast'
import type { Product } from '../utils/mockData'

interface CompareToolProps {
  products: Product[]
  initialSelected?: string[]
  onShare?: (selectedProducts: string[]) => void
  viewMode?: 'list' | 'grid'
}

export default function CompareTool({ 
  products, 
  initialSelected = [], 
  onShare,
  viewMode = 'list' 
}: CompareToolProps) {
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelected)
  const { show } = useToast()
  
  // Update selectedIds when initialSelected changes
  useEffect(() => {
    setSelectedIds(initialSelected)
  }, [initialSelected])
  
  const selectedProducts = useMemo<Product[]>(
    () => products.filter(p => selectedIds.includes(p.id)), 
    [products, selectedIds]
  )

  const toggle = (id: string) => {
    setSelectedIds((prev) => {
      if (prev.includes(id)) return prev.filter(x => x !== id)
      if (prev.length >= 4) {
        show({
          variant: 'warning',
          message: 'Maximum 4 products can be compared at once'
        })
        return prev
      }
      return [...prev, id]
    })
  }

  // Get all unique specification keys from selected products
  const specKeys = useMemo(() => {
    const allKeys = new Set<string>()
    selectedProducts.forEach(p => Object.keys(p.specs).forEach(k => allKeys.add(k)))
    return Array.from(allKeys).sort()
  }, [selectedProducts])

  // Check if a spec value differs across products
  const isSpecDifferent = (key: string) => {
    const values = selectedProducts.map(p => (p.specs as Record<string, unknown>)[key])
    return !values.every(val => val === values[0])
  }

  // Clear all selections
  const clearSelection = () => {
    setSelectedIds([])
    show({
      variant: 'info',
      message: 'Product selection cleared'
    })
  }

  // Export comparison as CSV
  const exportComparison = () => {
    if (selectedProducts.length < 2) {
      show({
        variant: 'warning',
        message: 'Select at least 2 products to export comparison'
      })
      return
    }

    const headers = ['Specification', ...selectedProducts.map(p => p.name)]
    const rows = [
      headers,
      ['Brand', ...selectedProducts.map(p => p.brand)],
      ['Price', ...selectedProducts.map(p => `$${p.price.toLocaleString()}`)],
      ['Rating', ...selectedProducts.map(p => `${p.rating.average}/5`)],
      ...specKeys.map(key => [
        key.charAt(0).toUpperCase() + key.slice(1),
        ...selectedProducts.map(p => String((p.specs as Record<string, unknown>)[key] ?? '-'))
      ])
    ]

    const csv = rows.map(row => row.map(cell => `"${cell}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `product-comparison-${Date.now()}.csv`
    a.click()
    URL.revokeObjectURL(url)

    show({
      variant: 'success',
      message: 'Comparison exported successfully'
    })
  }

  return (
    <div className="space-y-6">
      {/* Product Selection Interface */}
      <div className="card p-4">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="font-semibold text-[var(--text)]">
              Select Products to Compare
            </h2>
            <p className="text-sm text-[var(--muted)] mt-1">
              Choose up to 4 products • {selectedIds.length}/4 selected
            </p>
          </div>
          
          {selectedIds.length > 0 && (
            <div className="flex items-center gap-2">
              <button
                onClick={clearSelection}
                className="btn-outline text-sm"
              >
                Clear All
              </button>
              {onShare && (
                <button
                  onClick={() => onShare(selectedIds)}
                  className="btn-outline text-sm"
                  disabled={selectedIds.length < 2}
                >
                  Share
                </button>
              )}
            </div>
          )}
        </div>

        {/* Product Selection Grid/List */}
        {viewMode === 'grid' ? (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {products.map(product => (
              <label
                key={product.id}
                className={`cursor-pointer rounded-lg border-2 p-4 transition-all hover:shadow-md ${
                  selectedIds.includes(product.id)
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--brand-primary)]/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => toggle(product.id)}
                  className="sr-only"
                />
                <div className="space-y-3">
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                  <div>
                    <h3 className="font-medium text-sm line-clamp-2">{product.name}</h3>
                    <p className="text-xs text-[var(--muted)] mt-1">{product.brand}</p>
                    <p className="font-semibold text-[var(--brand-primary)] mt-2">
                      ${product.price.toLocaleString()}
                    </p>
                  </div>
                </div>
              </label>
            ))}
          </div>
        ) : (
          <div className="space-y-2">
            {products.map(product => (
              <label
                key={product.id}
                className={`flex items-center gap-4 p-3 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                  selectedIds.includes(product.id)
                    ? 'border-[var(--brand-primary)] bg-[var(--brand-primary)]/5'
                    : 'border-[var(--border)] hover:border-[var(--brand-primary)]/50'
                }`}
              >
                <input
                  type="checkbox"
                  checked={selectedIds.includes(product.id)}
                  onChange={() => toggle(product.id)}
                  className="h-4 w-4 text-[var(--brand-primary)] rounded border-gray-300 focus:ring-[var(--brand-primary)]"
                />
                <img
                  src={product.thumbnail}
                  alt={product.name}
                  className="w-12 h-12 object-cover rounded"
                />
                <div className="flex-1 min-w-0">
                  <h3 className="font-medium text-sm truncate">{product.name}</h3>
                  <p className="text-xs text-[var(--muted)]">{product.brand}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-[var(--brand-primary)]">
                    ${product.price.toLocaleString()}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <span className="text-xs text-[var(--muted)]">{product.rating.average}</span>
                    <svg className="w-3 h-3 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                    </svg>
                  </div>
                </div>
              </label>
            ))}
          </div>
        )}
      </div>

      {/* Comparison Results */}
      {selectedProducts.length >= 2 ? (
        <div className="space-y-4">
          {/* Actions Bar */}
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-[var(--text)]">
              Comparison Results ({selectedProducts.length} products)
            </h2>
            <div className="flex items-center gap-2">
              <button
                onClick={exportComparison}
                className="btn-outline text-sm"
              >
                Export CSV
              </button>
            </div>
          </div>

          {/* Product Overview Cards - Mobile */}
          <div className="grid grid-cols-1 gap-4 sm:hidden">
            {selectedProducts.map((product) => (
              <div key={product.id} className="card p-4">
                <div className="flex items-start gap-4">
                  <img
                    src={product.thumbnail}
                    alt={product.name}
                    className="w-16 h-16 object-cover rounded"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium">{product.name}</h3>
                    <p className="text-sm text-[var(--muted)]">{product.brand}</p>
                    <p className="font-semibold text-[var(--brand-primary)] mt-1">
                      ${product.price.toLocaleString()}
                    </p>
                    <div className="flex items-center gap-1 mt-1">
                      <span className="text-sm">{product.rating.average}</span>
                      <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    </div>
                  </div>
                  <Link
                    to={`/products/${product.id}`}
                    className="text-[var(--brand-primary)] text-sm hover:underline"
                  >
                    View Details
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Comparison Table - Desktop */}
          <div className="hidden sm:block overflow-x-auto card">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-4 text-left font-semibold border-b">
                    Specification
                  </th>
                  {selectedProducts.map(product => (
                    <th key={product.id} className="px-4 py-4 text-left border-b min-w-[200px]">
                      <div className="space-y-2">
                        <img
                          src={product.thumbnail}
                          alt={product.name}
                          className="w-16 h-16 object-cover rounded mx-auto"
                        />
                        <div className="text-center">
                          <p className="font-semibold line-clamp-2">{product.name}</p>
                          <p className="text-xs text-[var(--muted)] mt-1">{product.brand}</p>
                          <Link
                            to={`/products/${product.id}`}
                            className="text-[var(--brand-primary)] text-xs hover:underline mt-1 inline-block"
                          >
                            View Details
                          </Link>
                        </div>
                      </div>
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {/* Basic Information */}
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium bg-gray-50">Price</td>
                  {selectedProducts.map(product => {
                    const isDifferent = selectedProducts.some(p => p.price !== selectedProducts[0].price)
                    return (
                      <td key={product.id} className="px-4 py-3">
                        <span className={isDifferent ? 'font-semibold text-[var(--brand-primary)]' : ''}>
                          ${product.price.toLocaleString()}
                        </span>
                      </td>
                    )
                  })}
                </tr>
                <tr className="border-b">
                  <td className="px-4 py-3 font-medium bg-gray-50">Rating</td>
                  {selectedProducts.map(product => {
                    const isDifferent = selectedProducts.some(p => p.rating.average !== selectedProducts[0].rating.average)
                    return (
                      <td key={product.id} className="px-4 py-3">
                        <span className={isDifferent ? 'font-semibold text-[var(--brand-primary)]' : ''}>
                          {product.rating.average}/5 ⭐
                        </span>
                      </td>
                    )
                  })}
                </tr>
                
                {/* Specifications */}
                {specKeys.map(key => (
                  <tr key={key} className="border-b hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium bg-gray-50 capitalize">
                      {key.replace(/([A-Z])/g, ' $1').trim()}
                    </td>
                    {selectedProducts.map(product => {
                      const value = (product.specs as Record<string, unknown>)[key]
                      const isDifferent = isSpecDifferent(key)
                      return (
                        <td key={product.id} className="px-4 py-3">
                          <span className={isDifferent ? 'font-semibold text-[var(--brand-primary)]' : ''}>
                            {String(value ?? '-')}
                          </span>
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Specification Comparison */}
          <div className="sm:hidden space-y-4">
            <h3 className="font-semibold">Detailed Specifications</h3>
            {specKeys.map(key => (
              <div key={key} className="card p-4">
                <h4 className="font-medium capitalize mb-3">
                  {key.replace(/([A-Z])/g, ' $1').trim()}
                </h4>
                <div className="space-y-2">
                  {selectedProducts.map(product => {
                    const value = (product.specs as Record<string, unknown>)[key]
                    const isDifferent = isSpecDifferent(key)
                    return (
                      <div key={product.id} className="flex items-center justify-between">
                        <span className="text-sm text-[var(--muted)]">{product.name}</span>
                        <span className={`text-sm ${isDifferent ? 'font-semibold text-[var(--brand-primary)]' : ''}`}>
                          {String(value ?? '-')}
                        </span>
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="text-center py-12 card">
          <svg className="mx-auto h-16 w-16 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="text-lg font-medium text-[var(--text)] mb-2">Ready to Compare</h3>
          <p className="text-[var(--muted)]">
            Select at least 2 products from the list above to start comparing their features.
          </p>
        </div>
      )}
    </div>
  )
}
