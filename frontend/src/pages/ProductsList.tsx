import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useToast } from '../components/AlertToast'
import { api, type Product } from '../utils/api'

/**
 * Enhanced ProductsListPage - Now integrated with backend API
 * 
 * Features:
 * - Backend API integration for products
 * - Advanced filtering and sorting capabilities
 * - URL-based filter persistence (query parameters)
 * - Responsive layout with collapsible sidebar
 * - Search functionality with debouncing
 * - Category quick filters
 * - Results count and pagination support
 * - Loading states and empty states
 * - Mobile-optimized filter interface
 * 
 * Design Principles:
 * - Mobile-first responsive design
 * - Progressive disclosure of filter options
 * - Clear visual feedback for applied filters
 * - Accessible form controls with proper labeling
 * - Performance-optimized with memoization
 */

export default function ProductsListPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const { show } = useToast()
  
  // State for backend data
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [totalProducts, setTotalProducts] = useState(0)
  const [categories, setCategories] = useState<string[]>([])
  
  // Filter states - initialize from URL params
  const [category, setCategory] = useState<string>(searchParams.get('category') || '')
  const [sortBy, setSortBy] = useState<string>(searchParams.get('sortBy') || 'name')
  const [sortDir, setSortDir] = useState<'ASC' | 'DESC'>(searchParams.get('sortDir') as 'ASC' | 'DESC' || 'ASC')
  const [page, setPage] = useState<number>(Number(searchParams.get('page')) || 1)
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  
  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false)

  // Debounce search query for performance
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase())
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (category) params.set('category', category)
    if (sortBy !== 'name') params.set('sortBy', sortBy)
    if (sortDir !== 'ASC') params.set('sortDir', sortDir)
    if (page !== 1) params.set('page', page.toString())
    if (query) params.set('q', query)
    
    setSearchParams(params, { replace: true })
  }, [category, sortBy, sortDir, page, query, setSearchParams])

  // Fetch products from backend
  const fetchProducts = async () => {
    setLoading(true)
    try {
      const response = await api.getProducts({
        page,
        limit: 12,
        sortBy,
        sortDir,
        category: category || undefined,
      })
      
      if (response.success && response.data) {
        setProducts(response.data.products || [])
        setTotalProducts(response.data.pagination?.total || 0)
        
        // Extract unique categories from products
        const uniqueCategories = Array.from(new Set(
          (response.data.products || []).flatMap(p => 
            p.Categories?.map(c => c.name) || [p.category]
          ).filter(Boolean)
        )).sort()
        setCategories(uniqueCategories)
      } else {
        show({ variant: 'error', message: response.error || 'Failed to load products' })
      }
    } catch (error) {
      console.error('Failed to fetch products:', error)
      show({ variant: 'error', message: 'Failed to load products' })
    } finally {
      setLoading(false)
    }
  }

  // Fetch products when filters change
  useEffect(() => {
    fetchProducts()
  }, [page, sortBy, sortDir, category])

  // Filter products locally by search query (since backend doesn't have search yet)
  const filteredProducts = useMemo(() => {
    if (!debouncedQuery) return products
    
    return products.filter(p => 
      `${p.name} ${p.category} ${p.description || ''}`
        .toLowerCase()
        .includes(debouncedQuery)
    )
  }, [products, debouncedQuery])

  // Clear all filters
  const clearAllFilters = () => {
    setCategory('')
    setSortBy('name')
    setSortDir('ASC')
    setPage(1)
    setQuery('')
    
    show({
      variant: 'info',
      message: 'All filters cleared',
      duration: 2000
    })
  }

  // Count active filters
  const activeFiltersCount = [category, query].filter(Boolean).length + 
    (sortBy !== 'name' || sortDir !== 'ASC' ? 1 : 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Products</h1>
          <p className="text-[var(--muted)] mt-1">
            {loading ? 'Loading...' : `${filteredProducts?.length || 0} products found`}
            {activeFiltersCount > 0 && ` with ${activeFiltersCount} filter${activeFiltersCount > 1 ? 's' : ''} applied`}
          </p>
        </div>
        
        {/* Mobile filter toggle */}
        <button
          onClick={() => setFiltersOpen(!filtersOpen)}
          className="sm:hidden btn-outline flex items-center gap-2"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.414A1 1 0 013 6.707V4z" />
          </svg>
          Filters
          {activeFiltersCount > 0 && (
            <span className="rounded-full bg-[var(--brand-primary)] px-2 py-1 text-xs text-white">
              {activeFiltersCount}
            </span>
          )}
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <svg className="h-5 w-5 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
        </div>
        <input
          type="text"
          placeholder="Search products by name, category, description..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="input w-full pl-10 pr-4 py-3"
        />
        {query && (
          <button
            onClick={() => setQuery('')}
            className="absolute inset-y-0 right-0 pr-3 flex items-center"
          >
            <svg className="h-5 w-5 text-[var(--muted)] hover:text-[var(--text)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Quick Filter Categories */}
      {categories.length > 0 && (
        <div className="hidden sm:flex flex-wrap gap-2">
          <button
            onClick={() => setCategory('')}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              !category
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-gray-100 text-[var(--text)] hover:bg-gray-200'
            }`}
          >
            All Categories
          </button>
          {categories.slice(0, 5).map(cat => (
            <button
              key={cat}
              onClick={() => setCategory(category === cat ? '' : cat)}
              className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
                category === cat
                  ? 'bg-[var(--brand-primary)] text-white'
                  : 'bg-gray-100 text-[var(--text)] hover:bg-gray-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Filters Sidebar */}
        <aside className={`lg:col-span-1 space-y-4 ${filtersOpen ? 'block' : 'hidden'} sm:block`}>
          <div className="card p-4">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold text-[var(--text)]">Filters</h2>
              {activeFiltersCount > 0 && (
                <button
                  onClick={clearAllFilters}
                  className="text-sm text-[var(--brand-primary)] hover:text-[var(--brand-primary-700)]"
                >
                  Clear all
                </button>
              )}
            </div>

            <div className="space-y-4">
              {/* Category Filter */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Category
                </label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="select w-full"
                >
                  <option value="">All categories</option>
                  {categories.map(cat => (
                    <option key={cat} value={cat}>{cat}</option>
                  ))}
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Sort By
                </label>
                <select
                  value={`${sortBy}-${sortDir}`}
                  onChange={(e) => {
                    const [newSortBy, newSortDir] = e.target.value.split('-')
                    setSortBy(newSortBy)
                    setSortDir(newSortDir as 'ASC' | 'DESC')
                  }}
                  className="select w-full"
                >
                  <option value="name-ASC">Name A-Z</option>
                  <option value="name-DESC">Name Z-A</option>
                  <option value="price-ASC">Price: Low to High</option>
                  <option value="price-DESC">Price: High to Low</option>
                  <option value="createdAt-DESC">Newest First</option>
                  <option value="createdAt-ASC">Oldest First</option>
                </select>
              </div>
            </div>
          </div>
        </aside>

        {/* Products Grid */}
        <main className="lg:col-span-3">
          {/* Results Summary */}
          <div className="flex items-center justify-between mb-6">
            <div className="text-sm text-[var(--muted)]">
              Showing {filteredProducts?.length || 0} of {totalProducts} products
            </div>
            
            {/* Mobile Sort - Quick Access */}
            <div className="sm:hidden">
              <select
                value={`${sortBy}-${sortDir}`}
                onChange={(e) => {
                  const [newSortBy, newSortDir] = e.target.value.split('-')
                  setSortBy(newSortBy)
                  setSortDir(newSortDir as 'ASC' | 'DESC')
                }}
                className="select text-sm"
              >
                <option value="name-ASC">Name A-Z</option>
                <option value="price-ASC">Price ↑</option>
                <option value="price-DESC">Price ↓</option>
                <option value="createdAt-DESC">Newest</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            // Loading Skeleton
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse card overflow-hidden">
                  <div className="aspect-square bg-gray-200" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-gray-200 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                    <div className="h-4 bg-gray-200 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredProducts.length === 0 ? (
            // Empty State
            <div className="text-center py-16">
              <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.175-5.5-3.071A7.963 7.963 0 016 9c0-5.385 4.365-9.75 9.75-9.75S25.5 3.615 25.5 9a7.963 7.963 0 01-.5 3.071c-1.21 1.896-3.16 3.071-5.5 3.071z" />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-[var(--text)]">No products found</h3>
              <p className="mt-2 text-[var(--muted)]">
                Try adjusting your filters or search terms to find what you're looking for.
              </p>
              <button
                onClick={clearAllFilters}
                className="mt-4 btn-primary"
              >
                Clear all filters
              </button>
            </div>
          ) : (
            // Products Grid
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
              {filteredProducts.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}
