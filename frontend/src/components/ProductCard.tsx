import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { Product } from '../utils/mockData'
import { useFavorites } from './FavoritesContext'
import { useCart } from './CartContext'
import { useToast } from './AlertToast'

/*
  Enhanced ProductCard: Responsive product card component
  
  Features:
  - Displays product image with hover effects and loading states
  - Shows rating, price, and key product info
  - Heart icon for favorites (toggleable)
  - Add to cart functionality with toast notifications
  - Responsive design (mobile-first)
  - Smooth transitions and hover states
  - Badge system for product tags
  - Image error handling
  - Accessibility features (ARIA labels, keyboard navigation)
  
  Design Principles:
  - Mobile-first responsive design
  - Business-elegant styling with subtle animations
  - Clear visual hierarchy with proper typography
  - Consistent color system using CSS variables
  - Touch-friendly interactive elements
*/

type Props = {
  product: Product
  className?: string
  showQuickActions?: boolean // Controls visibility of hover actions
}

export default function ProductCard({ 
  product, 
  className = '', 
  showQuickActions = true
}: Props) {
  const { toggle, has } = useFavorites()
  const { add } = useCart()
  const { show } = useToast()
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  
  const isFavorited = has(product.id)
  
  // Display primary tag (first one)
  const primaryTag = product.tags[0]
  
  // Format price with proper currency formatting
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: product.currency || 'USD',
    }).format(price)
  }
  
  // Generate star rating display with half-star support
  const renderStars = (rating: number) => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5
    
    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        // Full star
        stars.push(
          <svg key={i} className="h-4 w-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      } else if (i === fullStars && hasHalfStar) {
        // Half star
        stars.push(
          <div key={i} className="relative h-4 w-4">
            <svg className="absolute h-4 w-4 fill-gray-200 text-gray-200" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <svg className="absolute h-4 w-4 fill-amber-400 text-amber-400" viewBox="0 0 20 20" style={{ clipPath: 'inset(0 50% 0 0)' }}>
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
          </div>
        )
      } else {
        // Empty star
        stars.push(
          <svg key={i} className="h-4 w-4 fill-gray-200 text-gray-200" viewBox="0 0 20 20">
            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
          </svg>
        )
      }
    }
    return stars
  }

  // Handle adding product to cart with user feedback
  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    add(product, 1)
    
    show({
      variant: 'success',
      message: `${product.name} added to cart!`,
      duration: 3000
    })
  }

  // Handle favorite toggle with user feedback
  const handleFavoriteToggle = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    toggle(product.id)
    
    show({
      variant: 'info',
      message: isFavorited 
        ? `${product.name} removed from favorites` 
        : `${product.name} added to favorites`,
      duration: 2000
    })
  }

  return (
    <article 
      className={`group relative overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--card)] shadow-sm transition-all duration-300 hover:shadow-lg hover:-translate-y-1 ${className}`}
      role="article"
      aria-labelledby={`product-title-${product.id}`}
    >
      {/* Product Image Container with aspect ratio preservation */}
      <div className="relative aspect-square overflow-hidden bg-gray-50">
        <Link 
          to={`/products/${product.id}`} 
          className="block h-full w-full focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 rounded-t-xl"
          aria-label={`View details for ${product.name}`}
        >
          {/* Loading spinner */}
          {!imageLoaded && !imageError && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
              <div className="h-8 w-8 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--brand-primary)]" role="status" aria-label="Loading image"></div>
            </div>
          )}
          
          {/* Image error state */}
          {imageError ? (
            <div className="flex h-full w-full items-center justify-center bg-gray-100 text-gray-400">
              <div className="text-center">
                <svg className="mx-auto h-12 w-12 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                <p className="text-xs">Image unavailable</p>
              </div>
            </div>
          ) : (
            <img
              src={product.thumbnail}
              alt={product.name}
              className={`h-full w-full object-cover transition-all duration-500 group-hover:scale-105 ${
                imageLoaded ? 'opacity-100' : 'opacity-0'
              }`}
              onLoad={() => setImageLoaded(true)}
              onError={() => setImageError(true)}
              loading="lazy"
            />
          )}
        </Link>
        
        {/* Favorite Heart Button - positioned for easy thumb access on mobile */}
        <button
          onClick={handleFavoriteToggle}
          className={`absolute right-3 top-3 rounded-full p-2 shadow-md transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 ${
            isFavorited 
              ? 'bg-red-500 text-white hover:bg-red-600' 
              : 'bg-white/90 text-gray-600 hover:bg-white hover:text-red-500'
          }`}
          aria-label={isFavorited ? 'Remove from favorites' : 'Add to favorites'}
          aria-pressed={isFavorited}
        >
          <svg className="h-4 w-4" fill={isFavorited ? 'currentColor' : 'none'} viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
          </svg>
        </button>
        
        {/* Product Badge - shows primary tag with semantic color coding */}
        {primaryTag && (
          <div className="absolute left-3 top-3">
            <span className={`rounded-full px-2 py-1 text-xs font-medium shadow-sm ${
              primaryTag === 'New Arrival' 
                ? 'bg-green-100 text-green-800'
                : primaryTag === 'Trending'
                ? 'bg-blue-100 text-blue-800'
                : primaryTag === 'Best Sellers'
                ? 'bg-purple-100 text-purple-800'
                : primaryTag === 'Budget-Friendly'
                ? 'bg-orange-100 text-orange-800'
                : primaryTag === 'Best for Gaming'
                ? 'bg-red-100 text-red-800'
                : primaryTag === 'Long Battery'
                ? 'bg-teal-100 text-teal-800'
                : primaryTag === 'Best Camera'
                ? 'bg-indigo-100 text-indigo-800'
                : 'bg-gray-100 text-gray-800'
            }`}>
              {primaryTag}
            </span>
          </div>
        )}
        
        {/* Premium Badge - highlights premium products */}
        {product.premium && (
          <div className="absolute right-3 bottom-3">
            <span className="rounded-full bg-gradient-to-r from-amber-400 to-orange-500 px-2 py-1 text-xs font-medium text-white shadow-sm">
              ✨ Premium
            </span>
          </div>
        )}
      </div>

      {/* Product Information Section */}
      <div className="p-4">
        {/* Brand Name */}
        <p className="text-sm font-medium text-[var(--muted)] mb-1">{product.brand}</p>
        
        {/* Product Name with proper heading hierarchy */}
        <Link to={`/products/${product.id}`} className="block">
          <h3 
            id={`product-title-${product.id}`}
            className="font-semibold text-[var(--text)] line-clamp-2 group-hover:text-[var(--brand-primary)] transition-colors duration-200 leading-tight"
          >
            {product.name}
          </h3>
        </Link>
        
        {/* Rating Display with accessible labeling */}
        <div className="flex items-center gap-2 mt-2 mb-3">
          <div className="flex items-center gap-1" role="img" aria-label={`Rated ${product.rating.average} out of 5 stars`}>
            {renderStars(product.rating.average)}
          </div>
          <span className="text-sm text-[var(--muted)]">
            {product.rating.average.toFixed(1)} ({product.rating.count.toLocaleString()})
          </span>
        </div>
        
        {/* Price and Actions Row */}
        <div className="flex items-center justify-between">
          <div className="flex items-baseline gap-2">
            <span className="text-xl font-bold text-[var(--text)]">
              {formatPrice(product.price)}
            </span>
            {/* Future: Show original price for discounted items */}
          </div>
          
          {/* Quick Actions - hidden by default, shown on hover for desktop */}
          {showQuickActions && (
            <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 sm:opacity-100 sm:group-hover:opacity-100">
              <Link
                to={`/products/${product.id}`}
                className="rounded-lg border border-[var(--border)] p-2 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 transition-colors"
                aria-label={`View details for ${product.name}`}
                title="View details"
              >
                <svg className="h-4 w-4 text-[var(--muted)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
              </Link>
              
              <button 
                onClick={handleAddToCart}
                className="rounded-lg bg-[var(--brand-primary)] p-2 text-white hover:bg-[var(--brand-primary-700)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-primary)] focus:ring-offset-2 transition-colors"
                aria-label={`Add ${product.name} to cart`}
                title="Add to cart"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </article>
  )
}
