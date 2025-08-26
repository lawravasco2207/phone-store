/**
 * Enhanced Compare Page
 * 
 * Features:
 * - Product selection with search and category filtering
 * - Side-by-side comparison table with difference highlighting
 * - Product image previews in comparison
 * - Export comparison results functionality
 * - Mobile-optimized responsive layout
 * - Share comparison via URL parameters
 * 
 * Design Principles:
 * - Clear product selection interface
 * - Visual emphasis on differing specifications
 * - Mobile-first responsive design
 * - Accessibility with proper ARIA labels
 * - URL state management for sharing comparisons
 */
import { useMemo, useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import CompareTool from '../components/CompareTool'
import { Catalog, type CategoryName } from '../utils/mockData'
import { useToast } from '../components/AlertToast'

export default function ComparePage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { show } = useToast()
  
  // State management
  const [category, setCategory] = useState<CategoryName | ''>(
    searchParams.get('category') as CategoryName || ''
  )
  const [searchQuery, setSearchQuery] = useState(searchParams.get('q') || '')
  const [isGridView, setIsGridView] = useState(false)
  
  // Initialize selected products from URL
  const initialSelected = useMemo(() => {
    const ids = searchParams.get('products')?.split(',').filter(Boolean) || []
    return ids.slice(0, 4) // Limit to 4 products max
  }, [searchParams])

  // Filter products based on category and search
  const filteredProducts = useMemo(() => {
    let products = category 
      ? Catalog.PRODUCTS.filter(p => p.categories.includes(category))
      : Catalog.PRODUCTS

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      products = products.filter(p => 
        p.name.toLowerCase().includes(query) ||
        p.brand.toLowerCase().includes(query) ||
        p.description.toLowerCase().includes(query) ||
        p.tags.some(tag => tag.toLowerCase().includes(query))
      )
    }

    return products
  }, [category, searchQuery])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (searchQuery) params.set('q', searchQuery)
    
    setSearchParams(params, { replace: true })
  }, [category, searchQuery, setSearchParams])

  // Handle sharing comparison
  const handleShare = (selectedProducts: string[]) => {
    if (selectedProducts.length < 2) {
      show({
        variant: 'warning',
        message: 'Select at least 2 products to share comparison'
      })
      return
    }

    const params = new URLSearchParams(searchParams)
    params.set('products', selectedProducts.join(','))
    
    const shareUrl = `${window.location.origin}${window.location.pathname}?${params.toString()}`
    
    if (navigator.share) {
      navigator.share({
        title: 'Product Comparison',
        text: `Compare ${selectedProducts.length} products`,
        url: shareUrl
      }).catch(() => {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl)
        show({
          variant: 'success',
          message: 'Comparison link copied to clipboard'
        })
      })
    } else {
      navigator.clipboard.writeText(shareUrl)
      show({
        variant: 'success',
        message: 'Comparison link copied to clipboard'
      })
    }
  }

  // Clear all filters
  const clearFilters = () => {
    setCategory('')
    setSearchQuery('')
    show({
      variant: 'info',
      message: 'Filters cleared'
    })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Compare Products</h1>
          <p className="text-[var(--muted)] mt-1">
            Select up to 4 products to compare their features side by side
          </p>
        </div>
        
        {/* View Toggle */}
        <div className="flex items-center gap-2 rounded-lg border border-[var(--border)] p-1">
          <button
            onClick={() => setIsGridView(false)}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              !isGridView 
                ? 'bg-[var(--brand-primary)] text-white' 
                : 'text-[var(--text)] hover:bg-gray-100'
            }`}
          >
            List View
          </button>
          <button
            onClick={() => setIsGridView(true)}
            className={`px-3 py-2 rounded text-sm font-medium transition-colors ${
              isGridView 
                ? 'bg-[var(--brand-primary)] text-white' 
                : 'text-[var(--text)] hover:bg-gray-100'
            }`}
          >
            Grid View
          </button>
        </div>
      </div>

      {/* Filter Controls */}
      <div className="card p-4 space-y-4">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Search */}
          <div className="flex-1 relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="Search products to compare..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input w-full pl-10"
            />
          </div>

          {/* Category Filter */}
          <div className="sm:w-48">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as CategoryName | '')}
              className="select w-full"
            >
              <option value="">All Categories</option>
              {Catalog.CATEGORIES.map(cat => (
                <option key={cat.id} value={cat.name}>{cat.name}</option>
              ))}
            </select>
          </div>

          {/* Clear Filters */}
          {(category || searchQuery) && (
            <button
              onClick={clearFilters}
              className="btn-outline whitespace-nowrap"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Filter Summary */}
        <div className="flex items-center justify-between text-sm text-[var(--muted)]">
          <span>
            {filteredProducts.length} product{filteredProducts.length !== 1 ? 's' : ''} available
            {category && ` in ${category}`}
            {searchQuery && ` matching "${searchQuery}"`}
          </span>
        </div>
      </div>

      {/* Comparison Tool */}
      <CompareTool 
        products={filteredProducts} 
        initialSelected={initialSelected}
        onShare={handleShare}
        viewMode={isGridView ? 'grid' : 'list'}
      />

      {/* Help Section */}
      <div className="card p-4 bg-blue-50 border-blue-200">
        <h3 className="font-semibold text-blue-900 mb-2">How to Compare Products</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Select 2-4 products from the list above</li>
          <li>• Differences in specifications are highlighted in the comparison table</li>
          <li>• Use filters to narrow down products by category or search terms</li>
          <li>• Share your comparison with others using the share button</li>
          <li>• Switch between list and grid views for better product selection</li>
        </ul>
      </div>
    </div>
  )
}
