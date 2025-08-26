import { Outlet, Route, Routes, Link } from 'react-router-dom'
import ProductsListPage from './pages/ProductsList'
import ProductDetailPage from './pages/ProductDetail'
import ComparePage from './pages/Compare'
import CheckoutPage from './pages/Checkout'
import HomePage from './pages/Home'
import AdminDashboard from './pages/AdminDashboard'
import CartPage from './pages/Cart'
import WishlistPage from './pages/Wishlist'
import './App.css'
import Header from './components/Header'
import Footer from './components/Footer'
import { ToastProvider } from './components/AlertToast'
import { CartProvider } from './components/CartContext'
import { FavoritesProvider } from './components/FavoritesContext'
import { useState, useRef, useEffect } from 'react'

function RootLayout() {
  const [showMockDataNotice, setShowMockDataNotice] = useState(true)
  const modalButtonRef = useRef<HTMLButtonElement>(null)

  // Focus the button when modal opens
  useEffect(() => {
    if (showMockDataNotice && modalButtonRef.current) {
      modalButtonRef.current.focus()
    }
  }, [showMockDataNotice])

  // Allow closing modal with Escape key
  useEffect(() => {
    if (!showMockDataNotice) return
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowMockDataNotice(false)
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [showMockDataNotice])

  return (
    <ToastProvider>
      <CartProvider>
        <FavoritesProvider>
          {/* Mock Data Notice Modal */}
          {showMockDataNotice && (
            <div
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
              role="dialog"
              aria-modal="true"
            >
              <div className="bg-white rounded-lg shadow-lg max-w-md w-full p-6 text-center mx-2">
                <h2 className="text-xl font-bold mb-3 text-[var(--brand-primary)]">Notice</h2>
                <p className="mb-5 text-[var(--text)]">
                  This site is for demonstration purposes only. All product data shown is <span className="font-semibold">mock data</span> and does not represent real products, offers, or availability.
                </p>
                <button
                  ref={modalButtonRef}
                  className="btn-primary w-full mt-2"
                  onClick={() => setShowMockDataNotice(false)}
                  aria-label="Dismiss mock data notice"
                >
                  I Understand
                </button>
              </div>
            </div>
          )}
          {/* App shell: neutral background with clear content container; space reserved for future AI surfaces (recommendations) */}
          <div className={`min-h-dvh flex flex-col bg-[var(--bg)] text-[var(--text)]${showMockDataNotice ? ' pointer-events-none select-none blur-sm' : ''}`}>
            <Header />
            <main className="flex-1">
              <div className="app-container py-6 sm:py-8">
                <Outlet />
              </div>
            </main>
            <Footer />
          </div>
        </FavoritesProvider>
      </CartProvider>
    </ToastProvider>
  )
}

// Pages (scaffolded for now)
// Home page is now a dedicated component in pages/Home.tsx

function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-bold">404 - Not found</h1>
      <p className="mt-2 text-gray-600">The page you’re looking for doesn’t exist.</p>
      <div className="mt-6">
        <Link to="/" className="rounded-lg border px-4 py-2 hover:bg-gray-50 focus-ring">Go home</Link>
      </div>
    </div>
  )
}

export default function App() {
  return (
    <Routes>
      <Route element={<RootLayout />}> 
  {/* index route renders the homepage */}
  <Route index element={<HomePage />} />
  <Route path="/products" element={<ProductsListPage />} />
  <Route path="/products/:id" element={<ProductDetailPage />} />
  <Route path="/compare" element={<ComparePage />} />
  <Route path="/cart" element={<CartPage />} />
  <Route path="/wishlist" element={<WishlistPage />} />
  <Route path="/checkout" element={<CheckoutPage />} />
  <Route path="/admin" element={<AdminDashboard />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}
