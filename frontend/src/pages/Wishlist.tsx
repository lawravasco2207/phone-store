import ProductCard from '../components/ProductCard'
import { useFavorites } from '../components/FavoritesContext'
import { Catalog } from '../utils/mockData'

export default function WishlistPage() {
  const fav = useFavorites()
  const products = Catalog.PRODUCTS.filter(p => fav.ids.includes(p.id))
  return (
    <section>
      <h1 className="text-2xl font-semibold">Wishlist</h1>
      {products.length === 0 ? (
        <p className="mt-2 text-gray-600">No favorites yet. Tap the heart on a product to add it.</p>
      ) : (
        <div className="mt-4 grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
          {products.map(p => <ProductCard key={p.id} product={p} />)}
        </div>
      )}
    </section>
  )
}
