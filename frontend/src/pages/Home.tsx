import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
import { api } from '../utils/api'
import type { Product } from '../utils/api'
import { useCategories } from '../components/CategoryContext'

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const { categories, loading: categoriesLoading } = useCategories()

  useEffect(() => {
    const fetchFeaturedProducts = async () => {
      setLoading(true)
      try {
        // Use the dedicated featured products endpoint
        const response = await api.getFeaturedProducts(6)
        
        if (response.success && response.data?.products) {
          setFeaturedProducts(response.data.products)
        }
      } catch (error) {
        console.error('Error fetching featured products:', error)
      } finally {
        setLoading(false)
      }
    }
    
    fetchFeaturedProducts()
  }, [])

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero: slightly smaller paddings on phones */}
      {/*
        Hero uses a soft brand gradient for a professional yet welcoming look.
        On mobile, padding is reduced; on larger screens it breathes more.
      */}
      <section className="rounded-xl bg-gradient-to-r from-[var(--brand-primary-50)] to-white p-5 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">E‑Com</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">Discover trending products across Electronics, Fashion, Home & Kitchen, Beauty, and Sports. Compare, wishlist, and checkout fast.</p>
        <div className="mt-4 flex gap-3">
          {/* Primary and secondary actions follow the app primitives for consistency */}
          <Link to="/products" className="btn-primary text-sm sm:text-base focus-ring">Browse products</Link>
          <Link to="/compare" className="btn-outline text-sm sm:text-base focus-ring">Compare</Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Featured</h2>
        <p className="mb-4 text-sm text-gray-600">Hand-picked highlights across categories.</p>
        
        {loading ? (
          <div className="flex justify-center p-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand-primary)] border-r-transparent"></div>
          </div>
        ) : featuredProducts.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No featured products available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {featuredProducts.map(product => (
              <ProductCard 
                key={product.id} 
                product={product}
              />
            ))}
          </div>
        )}
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Shop by category</h2>
        {categoriesLoading ? (
          <div className="flex justify-center p-8">
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-[var(--brand-primary)] border-r-transparent"></div>
          </div>
        ) : !categories || categories.length === 0 ? (
          <p className="text-center py-8 text-gray-500">No categories available.</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(category => (
              <Link 
                key={category.id} 
                to={`/products?category=${category.slug}`} 
                className="group overflow-hidden rounded-lg border border-[var(--border)]"
              >
                <div className="aspect-[4/3] bg-[var(--brand-primary-50)]/40">
                  <img 
                    src={category.image || 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80'} 
                    alt={category.name} 
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" 
                    loading="lazy" 
                  />
                </div>
                <div className="p-3">
                  <h3 className="font-medium text-sm sm:text-base">{category.name}</h3>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}
