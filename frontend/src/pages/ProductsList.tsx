import { useEffect, useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { useToast } from '../components/AlertToast'
import { Catalog, type Tag, type CategoryName, type SortKey } from '../utils/mockData'

/**
 * Enhanced ProductsListPage
 * 
 * Features:
 * - Advanced filtering and sorting capabilities
 * - URL-based filter persistence (query parameters)
 * - Responsive layout with collapsible sidebar
 * - Search functionality with debouncing
 * - Category quick filters
 * - Results count and pagination-ready structure
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
  
  // Filter states - initialize from URL params
  const [brand, setBrand] = useState<string>(searchParams.get('brand') || '')
  const [min, setMin] = useState<string>(searchParams.get('min') || '')
  const [max, setMax] = useState<string>(searchParams.get('max') || '')
  const [tag, setTag] = useState<Tag | ''>(searchParams.get('tag') as Tag || '')
  const [category, setCategory] = useState<CategoryName | ''>(searchParams.get('category') as CategoryName || '')
  const [minRating, setMinRating] = useState<string>(searchParams.get('minRating') || '')
  const [sort, setSort] = useState<SortKey>(searchParams.get('sort') as SortKey || 'popularity')
  const [query, setQuery] = useState(searchParams.get('q') || '')
  const [debouncedQuery, setDebouncedQuery] = useState(query)
  
  // UI state
  const [filtersOpen, setFiltersOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  // Debounce search query for performance
  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      setDebouncedQuery(query.trim().toLowerCase())
      setIsLoading(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [query])

  // Update URL params when filters change
  useEffect(() => {
    const params = new URLSearchParams()
    if (brand) params.set('brand', brand)
    if (min) params.set('min', min)
    if (max) params.set('max', max)
    if (tag) params.set('tag', tag)
    if (category) params.set('category', category)
    if (minRating) params.set('minRating', minRating)
    if (sort !== 'popularity') params.set('sort', sort)
    if (query) params.set('q', query)
    
    setSearchParams(params, { replace: true })
  }, [brand, min, max, tag, category, minRating, sort, query, setSearchParams])

  // Get unique brands and categories for filter options
  const availableBrands = useMemo(() => {
    return Array.from(new Set(Catalog.PRODUCTS.map(p => p.brand))).sort()
  }, [])

  const allTags: Tag[] = ['Best for Gaming', 'Trending', 'Budget-Friendly', 'New Arrival', 'Best Sellers', 'Long Battery', 'Best Camera']

  // Filter and sort products
  const filteredProducts = useMemo(() => {
    const filtered = Catalog.filterProducts(Catalog.PRODUCTS, {
      brands: brand ? [brand] : undefined,
      categories: category ? [category] : undefined,
      price: { 
        min: min ? Number(min) : undefined, 
        max: max ? Number(max) : undefined 
      },
      tags: tag ? [tag] : undefined,
      minRating: minRating ? Number(minRating) : undefined,
    })
    
    // Apply search query
    const searched = debouncedQuery
      ? filtered.filter(p => 
          `${p.name} ${p.brand} ${p.description} ${p.tags.join(' ')}`
            .toLowerCase()
            .includes(debouncedQuery)
        )
      : filtered
    
    return Catalog.sortProducts(searched, sort)
  }, [brand, min, max, tag, category, minRating, sort, debouncedQuery])

  // Clear all filters
  const clearAllFilters = () => {
    setBrand('')
    setMin('')
    setMax('')
    setTag('')
    setCategory('')
    setMinRating('')
    setQuery('')
    setSort('popularity')
    
    show({
      variant: 'info',
      message: 'All filters cleared',
      duration: 2000
    })
  }

  // Count active filters
  const activeFiltersCount = [brand, min, max, tag, category, minRating, query].filter(Boolean).length

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[var(--text)]">Products</h1>
          <p className="text-[var(--muted)] mt-1">
            {isLoading ? 'Searching...' : `${filteredProducts.length} products found`}
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
          placeholder="Search products, brands, descriptions..."
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

      {/* Quick Filter Tags - Desktop Only */}
      <div className="hidden sm:flex flex-wrap gap-2">
        {allTags.slice(0, 6).map(tagOption => (
          <button
            key={tagOption}
            onClick={() => setTag(tag === tagOption ? '' : tagOption)}
            className={`rounded-full px-4 py-2 text-sm font-medium transition-colors ${
              tag === tagOption
                ? 'bg-[var(--brand-primary)] text-white'
                : 'bg-gray-100 text-[var(--text)] hover:bg-gray-200'
            }`}
          >
            {tagOption}
          </button>
        ))}
      </div>

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
                  onChange={(e) => setCategory(e.target.value as CategoryName | '')}
                  className="select w-full"
                >
                  <option value="">All categories</option>
                  {Catalog.CATEGORIES.map(cat => (
                    <option key={cat.id} value={cat.name}>{cat.name}</option>
                  ))}
                </select>
              </div>

              {/* Brand Filter */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Brand
                </label>
                <select
                  value={brand}
                  onChange={(e) => setBrand(e.target.value)}
                  className="select w-full"
                >
                  <option value="">All brands</option>
                  {availableBrands.map(brandOption => (
                    <option key={brandOption} value={brandOption}>{brandOption}</option>
                  ))}
                </select>
              </div>

              {/* Tag Filter */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Product Tags
                </label>
                <select
                  value={tag}
                  onChange={(e) => setTag(e.target.value as Tag | '')}
                  className="select w-full"
                >
                  <option value="">All tags</option>
                  {allTags.map(tagOption => (
                    <option key={tagOption} value={tagOption}>{tagOption}</option>
                  ))}
                </select>
              </div>

              {/* Price Range */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Price Range
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number"
                    placeholder="Min"
                    value={min}
                    onChange={(e) => setMin(e.target.value)}
                    className="input"
                    min="0"
                  />
                  <input
                    type="number"
                    placeholder="Max"
                    value={max}
                    onChange={(e) => setMax(e.target.value)}
                    className="input"
                    min="0"
                  />
                </div>
              </div>

              {/* Rating Filter */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Minimum Rating
                </label>
                <select
                  value={minRating}
                  onChange={(e) => setMinRating(e.target.value)}
                  className="select w-full"
                >
                  <option value="">Any rating</option>
                  <option value="4.5">4.5+ stars</option>
                  <option value="4">4+ stars</option>
                  <option value="3.5">3.5+ stars</option>
                  <option value="3">3+ stars</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-[var(--text)] mb-2">
                  Sort By
                </label>
                <select
                  value={sort}
                  onChange={(e) => setSort(e.target.value as SortKey)}
                  className="select w-full"
                >
                  <option value="popularity">Most Popular</option>
                  <option value="newest">Newest First</option>
                  <option value="best-sellers">Best Sellers</option>
                  <option value="price-asc">Price: Low to High</option>
                  <option value="price-desc">Price: High to Low</option>
                  <option value="rating-desc">Highest Rated</option>
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
              Showing {filteredProducts.length} of {Catalog.PRODUCTS.length} products
            </div>
            
            {/* Mobile Sort - Quick Access */}
            <div className="sm:hidden">
              <select
                value={sort}
                onChange={(e) => setSort(e.target.value as SortKey)}
                className="select text-sm"
              >
                <option value="popularity">Popular</option>
                <option value="newest">Newest</option>
                <option value="best-sellers">Best Sellers</option>
                <option value="price-asc">Price ↑</option>
                <option value="price-desc">Price ↓</option>
                <option value="rating-desc">Rating</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {isLoading ? (
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
