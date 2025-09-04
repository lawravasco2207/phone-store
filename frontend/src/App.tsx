import { Outlet, Route, Routes, Link } from 'react-router-dom'
import SupportRoutes from './components/support/SupportRoutes'
import AIDynamicRoutes from './components/AIDynamicRoutes'
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
import { AuthProvider } from './components/AuthContext'
import { ChatWindow } from './components/chat'
import { CategoryProvider } from './components/CategoryContext'
import { AuthPromptProvider } from './components/AuthPromptContext'

function RootLayout() {
  return (
    <ToastProvider>
      <AuthProvider>
        <AuthPromptProvider>
        <CartProvider>
          <FavoritesProvider>
            <CategoryProvider>
              {/* App shell with clean, responsive layout */}
              <div className="min-h-dvh flex flex-col bg-[var(--bg)] text-[var(--text)]">
                <Header />
                <main className="flex-1">
                  <div className="app-container py-6 sm:py-8">
                    <Outlet />
                  </div>
                </main>
                <Footer />
              </div>
              <ChatWindow />
            </CategoryProvider>
          </FavoritesProvider>
        </CartProvider>
        </AuthPromptProvider>
      </AuthProvider>
    </ToastProvider>
  )
}

// 404 page
function NotFoundPage() {
  return (
    <div className="py-24 text-center">
      <h1 className="text-3xl font-bold">404 - Not found</h1>
      <p className="mt-2 text-gray-600">The page you're looking for doesn't exist.</p>
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
        <Route index element={<HomePage />} />
  {/* AI dynamic routes under /ai/* */}
  <Route path="/ai/*" element={<AIDynamicRoutes />} />
        <Route path="/products" element={<ProductsListPage />} />
        <Route path="/products/:id" element={<ProductDetailPage />} />
        <Route path="/compare" element={<ComparePage />} />
        <Route path="/cart" element={<CartPage />} />
        <Route path="/wishlist" element={<WishlistPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/admin" element={<AdminDashboard />} />
  {/* Support: chat, new ticket, list, details */}
  <Route path="/support/*" element={<SupportRoutes />} />
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  )
}