import { useState, useEffect } from 'react'
import ProductCard from '../components/ProductCard'
import { useFavorites } from '../components/FavoritesContext'
import { api } from '../utils/api'
import type { Product } from '../utils/api'

export default function WishlistPage() {
  const { ids } = useFavorites()
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true)
      try {
        // Fetch all products then filter by favorites
        // In a real production app, we would have a dedicated API endpoint
        // to fetch products by IDs
        const response = await api.getProducts()
        
        if (response.success && response.data?.products) {
          // Filter products that are in the favorites list
          const favoriteProducts = (response.data.products || []).filter(p => 
            ids.includes(p.id.toString())
          )
          setProducts(favoriteProducts)
        }
      } catch (error) {
        console.error('Error fetching wishlist products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchProducts()
  }, [ids])

  return (
    <section>
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      
      {loading ? (
        <div className="mt-4 text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent" role="status">
            <span className="sr-only">Loading...</span>
          </div>
        </div>
      ) : products.length === 0 ? (
        <p className="mt-2 text-gray-600">No favorites yet. Tap the heart on a product to add it.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map(product => (
            <ProductCard 
              key={product.id} 
              product={{
                // @ts-ignore - ProductCard expects a string ID but our API uses numbers
                id: product.id.toString(),
                name: product.name,
                price: product.price,
                thumbnail: product.images?.[0] || '',
                brand: product.category,
                rating: { average: 4.5, count: 100 }, // Default rating if not available
                // Add other required properties with default values
                categories: [product.category],
                media: { images: product.images || [] },
                view360: product.images || [],
                tags: [],
                popularity: 0,
                sales: 0,
                createdAt: new Date().toISOString(),
                specs: {},
                currency: 'USD',
                description: product.description || ''
              }} 
            />
          ))}
        </div>
      )}
    </section>
  )
}
