import { Link } from 'react-router-dom'
import ProductCard from '../components/ProductCard'
// New multi-category catalog (electronics, fashion, home, beauty, sports)
import { Catalog } from '../utils/mockData'

export default function HomePage() {
  // Featured pulls a curated slice from the new catalog
  const featured = Catalog.getFeatured(Catalog.PRODUCTS)

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* Hero: slightly smaller paddings on phones */}
      {/*
        Hero uses a soft brand gradient for a professional yet welcoming look.
        On mobile, padding is reduced; on larger screens it breathes more.
      */}
      <section className="rounded-xl bg-gradient-to-r from-[var(--brand-primary-50)] to-white p-5 sm:p-8">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">E‑Com</h1>
        <p className="mt-2 max-w-2xl text-sm text-gray-600 sm:text-base">Discover trending products across Electronics, Fashion, Home & Kitchen, Beauty, and Sports. Compare, wishlist, and checkout fast—all frontend, mock-backend ready.</p>
        <div className="mt-4 flex gap-3">
          {/* Primary and secondary actions follow the app primitives for consistency */}
          <Link to="/products" className="btn-primary text-sm sm:text-base focus-ring">Browse products</Link>
          <Link to="/compare" className="btn-outline text-sm sm:text-base focus-ring">Compare</Link>
        </div>
      </section>

      <section>
        <h2 className="mb-2 text-xl font-semibold">Featured</h2>
        <p className="mb-4 text-sm text-gray-600">Hand-picked highlights across categories.</p>
  <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {featured.map(p => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xl font-semibold">Shop by category</h2>
        <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {Catalog.CATEGORIES.map(c => (
            <Link key={c.id} to={`/products?category=${c.slug}`} className="group overflow-hidden rounded-lg border border-[var(--border)]">
              <div className="aspect-[4/3] bg-[var(--brand-primary-50)]/40">
                <img src={c.image} alt={c.name} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.03]" loading="lazy" />
              </div>
              <div className="p-3">
                <h3 className="font-medium text-sm sm:text-base">{c.name}</h3>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
