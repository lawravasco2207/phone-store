import { useMemo, useState, useEffect } from 'react'
import React from 'react'
import { useParams, Link } from 'react-router-dom'
import { Catalog, type Product } from '../utils/mockData'
import Viewer360 from '../components/Viewer360'
import { useCart } from '../components/CartContext'
import { useFavorites } from '../components/FavoritesContext'
import { useToast } from '../components/AlertToast'

/**
 * Enhanced ProductDetailPage
 * 
 * Features:
 * - 360° product viewer with media carousel
 * - Comprehensive product information with specs
 * - Interactive add to cart and favorites
 * - Related products recommendations
 * - Responsive layout (mobile-first)
 * - Progressive enhancement with 3D models
 * - Breadcrumb navigation
 * - Social sharing (future)
 * - Review summary (future)
 * 
 * Design Principles:
 * - Mobile-first responsive design
 * - Progressive disclosure of information
 * - Clear visual hierarchy
 * - Touch-friendly interactions
 * - Accessible navigation and controls
 */

export default function ProductDetailPage() {
  const { id } = useParams()
  const { add } = useCart()
  const { has, toggle } = useFavorites()
  const { show } = useToast()
  
  const [selectedImageIndex, setSelectedImageIndex] = useState(0)
  const [quantity, setQuantity] = useState(1)
  const [activeTab, setActiveTab] = useState<'specs' | 'description' | 'reviews'>('description')
  
  const product = useMemo<Product | undefined>(() => Catalog.PRODUCTS.find(p => p.id === id), [id])
  const relatedProducts = useMemo(() => {
    if (!product) return []
    return Catalog.PRODUCTS
      .filter(p => p.id !== product.id && p.categories.some(cat => product.categories.includes(cat)))
      .slice(0, 4)
  }, [product])
  
  const totalFrames = product?.view360?.length ?? 0
  const isFavorited = product ? has(product.id) : false

  // Lazy-load the model-viewer web component only when needed (premium products)
  const shouldLoadModelViewer = !!(product && product.premium && product.model3dUrl)
  useEffect(() => {
    if (!shouldLoadModelViewer) return
    const already = document.querySelector('script[data-model-viewer]')
    if (already) return
    const s = document.createElement('script')
    s.type = 'module'
    s.setAttribute('data-model-viewer', 'true')
    s.src = 'https://unpkg.com/@google/model-viewer/dist/model-viewer.min.js'
    document.head.appendChild(s)
    return () => { /* keep loaded */ }
  }, [shouldLoadModelViewer])

  // Format price with currency
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product?.currency || 'USD',
    }).format(price)
  }

  // Generate star rating display
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(
          <svg key={i} className="h-5 w-5 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      } else if (i === fullStars && hasHalfStar) {
        stars.push(
          <div key={i} className="relative h-5 w-5">
            <svg className="absolute h-5 w-5 fill-gray-200 text-gray-200" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <svg className="absolute h-5 w-5 fill-amber-400 text-amber-400" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 50% 0 0)' }}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )
      } else {
        stars.push(
          <svg key={i} className="h-5 w-5 fill-gray-200 text-gray-200" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      }
    }
    return stars
  }

  // Handle add to cart with quantity
  const handleAddToCart = () => {
    if (!product) return
    
    add(product, quantity)
    
    show({
      variant: 'success',
      message: `${product.name} (${quantity}) added to cart!`,
      duration: 3000
    })
  }

  // Handle favorite toggle
  const handleFavoriteToggle = () => {
    if (!product) return
    
    toggle(product.id)
    
    show({
      variant: 'info',
      message: isFavorited 
        ? `${product.name} removed from favorites` 
        : `${product.name} added to favorites`,
      duration: 2000
    })
  }

  if (!product) {
    return (
      <div className="py-16 text-center">
        <div className="mx-auto max-w-md">
          <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 12h6m-6-4h6m2 5.291A7.962 7.962 0 0112 15c-2.34 0-4.29-1.175-5.5-3.071A7.963 7.963 0 016 9c0-5.385 4.365-9.75 9.75-9.75S25.5 3.615 25.5 9a7.963 7.963 0 01-.5 3.071c-1.21 1.896-3.16 3.071-5.5 3.071z" />
          </svg>
          <h1 className="mt-4 text-2xl font-bold text-gray-900">Product not found</h1>
          <p className="mt-2 text-gray-600">The product you're looking for doesn't exist or has been removed.</p>
          <Link to="/products" className="mt-4 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-primary)] px-4 py-2 text-white hover:bg-[var(--brand-primary-700)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            Browse all products
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Breadcrumb Navigation */}
      <nav className="flex items-center space-x-2 text-sm text-[var(--muted)]" aria-label="Breadcrumb">
        <Link to="/" className="hover:text-[var(--brand-primary)]">Home</Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <Link to="/products" className="hover:text-[var(--brand-primary)]">Products</Link>
        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-[var(--text)]">{product.name}</span>
      </nav>

      {/* Main Product Section */}
      <section className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Left Column - Media */}
        <div className="space-y-4">
          {/* Primary media: 360° image viewer or main image */}
          {totalFrames > 0 ? (
            <Viewer360 
              frames={product.view360!} 
              alt={`${product.name} 360° view`}
              className="w-full"
            />
          ) : (
            <div className="aspect-square overflow-hidden rounded-xl border border-[var(--border)] bg-gray-50">
              <img 
                src={product.media.images[selectedImageIndex] || product.thumbnail} 
                alt={product.name} 
                className="h-full w-full object-cover" 
              />
            </div>
          )}

          {/* Media thumbnails carousel */}
          <div className="flex gap-2 overflow-x-auto pb-2">
            {product.media.images.slice(0, 8).map((src, i) => (
              <button
                key={i}
                onClick={() => setSelectedImageIndex(i)}
                className={`h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  selectedImageIndex === i 
                    ? 'border-[var(--brand-primary)] ring-2 ring-[var(--brand-primary)]/20' 
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <img 
                  src={src} 
                  alt={`${product.name} view ${i + 1}`} 
                  className="h-full w-full object-cover" 
                  loading="lazy" 
                />
              </button>
            ))}
            {product.media.gif && (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-gray-200">
                <img 
                  src={product.media.gif} 
                  alt={`${product.name} animation`} 
                  className="h-full w-full object-cover" 
                  loading="lazy" 
                />
              </div>
            )}
            {product.media.video && (
              <div className="h-16 w-16 shrink-0 overflow-hidden rounded-lg border-2 border-gray-200">
                <video 
                  className="h-full w-full object-cover" 
                  muted 
                  playsInline 
                  loop
                  poster={product.thumbnail}
                >
                  <source src={product.media.video} type="video/mp4" />
                </video>
              </div>
            )}
          </div>

          {/* Optional 3D model for premium products */}
          {product.premium && product.model3dUrl && (
            <div className="rounded-xl border border-[var(--border)] bg-[var(--card)] p-4">
              <div className="mb-3 flex items-center gap-2">
                <span className="text-sm font-medium text-[var(--text)]">3D Preview</span>
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-1 text-xs font-medium text-white">
                  ✨ Premium
                </span>
              </div>
              {React.createElement('model-viewer' as unknown as keyof JSX.IntrinsicElements, {
                src: product.model3dUrl,
                alt: product.name,
                ar: true,
                'camera-controls': true,
                'auto-rotate': true,
                style: { width: '100%', height: 360, borderRadius: '0.5rem' },
              })}
            </div>
          )}
        </div>

        {/* Right Column - Product Information */}
        <div className="space-y-6">
          {/* Product Header */}
          <div>
            <div className="mb-2 flex items-center gap-2">
              <span className="text-sm font-medium text-[var(--muted)]">{product.brand}</span>
              {product.premium && (
                <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-1 text-xs font-medium text-white">
                  ✨ Premium
                </span>
              )}
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] lg:text-4xl">
              {product.name}
            </h1>
            
            {/* Rating and Tags */}
            <div className="mt-4 flex flex-wrap items-center gap-3">
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  {renderStars(product.rating.average)}
                </div>
                <span className="text-sm text-[var(--muted)]">
                  {product.rating.average.toFixed(1)} ({product.rating.count.toLocaleString()} reviews)
                </span>
              </div>
            </div>
            
            <div className="mt-3 flex flex-wrap gap-2">
              {product.tags.slice(0, 3).map(tag => (
                <span 
                  key={tag} 
                  className={`rounded-full px-3 py-1 text-sm font-medium ${
                    tag === 'New Arrival' 
                      ? 'bg-green-100 text-green-800'
                      : tag === 'Trending'
                      ? 'bg-blue-100 text-blue-800'
                      : tag === 'Best Sellers'
                      ? 'bg-purple-100 text-purple-800'
                      : 'bg-gray-100 text-gray-800'
                  }`}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          {/* Price */}
          <div className="border-b border-[var(--border)] pb-6">
            <div className="flex items-baseline gap-3">
              <span className="text-3xl font-bold text-[var(--text)]">
                {formatPrice(product.price)}
              </span>
              {/* Future: Original price for discounts */}
            </div>
          </div>

          {/* Add to Cart Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="flex items-center">
                <label htmlFor="quantity" className="mr-3 text-sm font-medium text-[var(--text)]">
                  Quantity:
                </label>
                <select
                  id="quantity"
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="input w-20"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                className="btn-primary flex-1 text-base py-3 px-6"
              >
                Add to cart • {formatPrice(product.price * quantity)}
              </button>
              
              <button
                onClick={handleFavoriteToggle}
                className={`rounded-lg border p-3 transition-colors ${
                  isFavorited
                    ? 'border-red-500 bg-red-50 text-red-600 hover:bg-red-100'
                    : 'border-[var(--border)] text-[var(--muted)] hover:bg-gray-50'
                }`}
                aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
              >
                <svg className="h-6 w-6" fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Product Information Tabs - Moved to bottom for better UX */}
      <section className="border-t border-[var(--border)] pt-8">
        <div className="flex space-x-6 border-b border-[var(--border)]">
          {(['description', 'specs', 'reviews'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-3 text-base font-medium capitalize transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-[var(--brand-primary)] text-[var(--brand-primary)]'
                  : 'text-[var(--muted)] hover:text-[var(--text)]'
              }`}
            >
              {tab === 'specs' ? 'Specifications' : tab}
            </button>
          ))}
        </div>

        <div className="mt-8">
          {activeTab === 'description' && (
            <div className="max-w-none">
              <h3 className="text-lg font-semibold text-[var(--text)] mb-4">Product Description</h3>
              <div className="prose prose-lg max-w-none">
                <p className="text-[var(--muted)] leading-relaxed text-base">
                  {product.description}
                </p>
              </div>
            </div>
          )}

          {activeTab === 'specs' && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-6">Technical Specifications</h3>
              <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                {Object.entries(product.specs).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center rounded-lg border border-[var(--border)] p-4 hover:bg-gray-50 transition-colors">
                    <span className="font-medium capitalize text-[var(--text)]">
                      {key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').trim()}:
                    </span>
                    <span className="text-[var(--muted)] font-mono text-sm">{value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'reviews' && (
            <div>
              <h3 className="text-lg font-semibold text-[var(--text)] mb-6">Customer Reviews</h3>
              <div className="text-center py-12 bg-gray-50 rounded-lg">
                <svg className="mx-auto h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <h4 className="mt-4 text-xl font-medium text-[var(--text)]">Reviews Coming Soon!</h4>
                <p className="mt-2 text-[var(--muted)]">
                  Customer review functionality will be available in the next update.
                </p>
                <div className="mt-6 flex items-center justify-center gap-2 text-sm text-[var(--muted)]">
                  <span>Current rating:</span>
                  <div className="flex items-center gap-1">
                    {renderStars(product.rating.average)}
                  </div>
                  <span>({product.rating.count.toLocaleString()} reviews)</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <section className="border-t border-[var(--border)] pt-8">
          <h2 className="mb-6 text-2xl font-bold text-[var(--text)]">Related Products</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map(relatedProduct => (
              <Link
                key={relatedProduct.id}
                to={`/products/${relatedProduct.id}`}
                className="group overflow-hidden rounded-lg border border-[var(--border)] bg-[var(--card)] transition-all hover:shadow-md"
              >
                <div className="aspect-square overflow-hidden bg-gray-50">
                  <img
                    src={relatedProduct.thumbnail}
                    alt={relatedProduct.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="p-3">
                  <p className="text-xs text-[var(--muted)]">{relatedProduct.brand}</p>
                  <h3 className="font-medium text-[var(--text)] line-clamp-2 group-hover:text-[var(--brand-primary)]">
                    {relatedProduct.name}
                  </h3>
                  <p className="mt-1 font-semibold text-[var(--text)]">
                    {formatPrice(relatedProduct.price)}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  )
}
