import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useCart } from '../components/CartContext'
import { useFavorites } from '../components/FavoritesContext'
import { useAuth } from '../components/AuthContext'
import { api, API_BASE_URL, type Product, type Review } from '../utils/api'
import { formatPrice } from '../utils/format'
import { useToast } from '../components/AlertToast'
import Viewer360 from '../components/Viewer360'
import { getProductPlaceholder } from '../utils/imageUtils'

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { ids: favorites, toggle: toggleFavorite } = useFavorites()
  const { user } = useAuth()
  const { show } = useToast()
  
  const [product, setProduct] = useState<Product | null>(null)
  const [reviews, setReviews] = useState<Review[]>([])
  const [currentImageIndex, setCurrentImageIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [reviewsLoading, setReviewsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [adding, setAdding] = useState(false)
  
  // Review form state
  const [reviewRating, setReviewRating] = useState(5)
  const [reviewComment, setReviewComment] = useState('')
  const [submittingReview, setSubmittingReview] = useState(false)

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) {
        setError('Invalid product ID')
        setLoading(false)
        return
      }

      try {
        const response = await api.getProduct(parseInt(id))
        if (response.success && response.data) {
          setProduct(response.data.product)
        } else {
          setError(response.error || 'Product not found')
        }
      } catch (error) {
        setError('Failed to load product')
      } finally {
        setLoading(false)
      }
    }

    fetchProduct()
  }, [id])

  useEffect(() => {
    const fetchReviews = async () => {
      if (!id) return
      
      setReviewsLoading(true)
      try {
        const response = await api.getReviews(parseInt(id))
        if (response.success && response.data) {
          setReviews(response.data.reviews)
        }
      } catch (error) {
        console.error('Failed to fetch reviews:', error)
      } finally {
        setReviewsLoading(false)
      }
    }

    fetchReviews()
  }, [id])

  const handleAddToCart = async () => {
    if (!product) return
    
    setAdding(true)
    try {
      const success = await addToCart(product.id, 1)
      if (success) {
        show({ variant: 'success', message: `${product.name} added to cart` })
      } else {
        show({ variant: 'error', message: 'Failed to add to cart' })
      }
    } catch (error) {
      show({ variant: 'error', message: 'Failed to add to cart' })
    } finally {
      setAdding(false)
    }
  }

  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!product || !user) return

    setSubmittingReview(true)
    try {
      const response = await api.createReview(product.id, {
        rating: reviewRating,
        comment: reviewComment.trim(),
      })

      if (response.success) {
        show({ variant: 'success', message: 'Review submitted successfully' })
        setReviewComment('')
        setReviewRating(5)
        
        // Refresh reviews
        const reviewsResponse = await api.getReviews(product.id)
        if (reviewsResponse.success && reviewsResponse.data) {
          setReviews(reviewsResponse.data.reviews)
        }
      } else {
        show({ variant: 'error', message: response.error || 'Failed to submit review' })
      }
    } catch (error) {
      show({ variant: 'error', message: 'Failed to submit review' })
    } finally {
      setSubmittingReview(false)
    }
  }

  if (loading) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-gray-600">Loading product...</p>
        </div>
      </section>
    )
  }

  if (error || !product) {
    return (
      <section className="py-8">
        <div className="container mx-auto px-4 text-center">
          <p className="text-red-600 mb-4">{error || 'Product not found'}</p>
          <button onClick={() => navigate(-1)} className="btn-outline">
            Go Back
          </button>
        </div>
      </section>
    )
  }

  const isFavorite = favorites.includes(product.id.toString())
  const averageRating = reviews.length > 0 
    ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length 
    : 0

  const images = product.images && product.images.length > 0 
    ? product.images 
    : [getProductPlaceholder(product)] // Fallback image

  return (
    <section className="py-8">
      <div className="container mx-auto px-4">
        <button 
          onClick={() => navigate(-1)} 
          className="mb-6 text-blue-600 hover:text-blue-800 flex items-center gap-2"
        >
          ← Back
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="aspect-square rounded-lg overflow-hidden bg-gray-100">
              <img
                src={images[currentImageIndex]}
                alt={product.name}
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = getProductPlaceholder(product)
                }}
              />
            </div>
            
            {images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto">
                {images.map((image, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentImageIndex(index)}
                    className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                      currentImageIndex === index ? 'border-blue-500' : 'border-gray-200'
                    }`}
                  >
                    <img
                      src={image}
                      alt={`${product.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = `${API_BASE_URL}/placeholder/64/64`
                      }}
                    />
                  </button>
                ))}
              </div>
            )}

            {/* 360° Viewer placeholder */}
            <Viewer360 frames={images} />
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-3xl font-bold">{product.name}</h1>
              <div className="mt-2 flex items-center gap-4">
                <div className="text-3xl font-bold text-blue-600">
                  {formatPrice(product.price)}
                </div>
                {reviews.length > 0 && (
                  <div className="flex items-center gap-2">
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= averageRating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <span className="text-sm text-gray-600">
                      ({reviews.length} review{reviews.length !== 1 ? 's' : ''})
                    </span>
                  </div>
                )}
              </div>
            </div>

            {product.description && (
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700 leading-relaxed">{product.description}</p>
              </div>
            )}

            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <span className="font-medium">Categories:</span>
                {product.Categories && product.Categories.length > 0 ? (
                  <div className="flex flex-wrap gap-1">
                    {product.Categories.map((cat, index) => (
                      <span 
                        key={cat.id || index} 
                        className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded-full text-gray-700"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                ) : product.category ? (
                  <div className="flex flex-wrap gap-1">
                    <span className="text-sm font-medium bg-gray-100 px-2 py-0.5 rounded-full text-gray-700">
                      {product.category}
                    </span>
                  </div>
                ) : (
                  <span className="text-gray-600">No categories</span>
                )}
              </div>
              
              {product.inventory !== undefined && (
                <div className="flex items-center gap-2">
                  <span className="font-medium">Stock:</span>
                  <span className={`${product.inventory > 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {product.inventory > 0 ? `${product.inventory} available` : 'Out of stock'}
                  </span>
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={handleAddToCart}
                disabled={adding || (product.inventory !== undefined && product.inventory <= 0)}
                className="btn-primary flex-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {adding ? 'Adding...' : 'Add to Cart'}
              </button>
              
              <button
                onClick={() => toggleFavorite(product.id.toString())}
                className={`btn-outline px-4 ${isFavorite ? 'bg-red-50 border-red-200 text-red-600' : ''}`}
              >
                {isFavorite ? '♥' : '♡'}
              </button>
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-12 border-t pt-8">
          <h2 className="text-2xl font-bold mb-6">Customer Reviews</h2>
          
          {/* Review Form */}
          {user && (
            <div className="bg-gray-50 rounded-lg p-6 mb-8">
              <h3 className="text-lg font-semibold mb-4">Write a Review</h3>
              <form onSubmit={handleSubmitReview} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Rating
                  </label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onClick={() => setReviewRating(star)}
                        className={`text-2xl ${star <= reviewRating ? 'text-yellow-400' : 'text-gray-300'} hover:text-yellow-400`}
                      >
                        ★
                      </button>
                    ))}
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Comment
                  </label>
                  <textarea
                    value={reviewComment}
                    onChange={(e) => setReviewComment(e.target.value)}
                    placeholder="Share your thoughts about this product..."
                    className="input w-full"
                    rows={4}
                    required
                  />
                </div>
                
                <button
                  type="submit"
                  disabled={submittingReview || !reviewComment.trim()}
                  className="btn-primary disabled:opacity-50"
                >
                  {submittingReview ? 'Submitting...' : 'Submit Review'}
                </button>
              </form>
            </div>
          )}

          {/* Reviews List */}
          {reviewsLoading ? (
            <p className="text-gray-600">Loading reviews...</p>
          ) : reviews.length === 0 ? (
            <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
          ) : (
            <div className="space-y-6">
              {reviews.map((review) => (
                <div key={review.id} className="border-b pb-6">
                  <div className="flex items-center gap-3 mb-2">
                    <div className="font-medium">{review.User?.name || 'Anonymous'}</div>
                    <div className="flex items-center">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <span
                          key={star}
                          className={`text-sm ${star <= review.rating ? 'text-yellow-400' : 'text-gray-300'}`}
                        >
                          ★
                        </span>
                      ))}
                    </div>
                    <div className="text-sm text-gray-500">
                      {new Date(review.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <p className="text-gray-700">{review.comment}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
