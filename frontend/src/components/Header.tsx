import { Link, NavLink } from 'react-router-dom'
import { useState } from 'react'
import { useCart } from './CartContext'
import { useFavorites } from './FavoritesContext'
import { useAuth } from './AuthContext'
import { AuthModal } from './AuthModal'

// Header with brand, nav, and cart badge; extracted for reuse and clarity
export default function Header() {
  const { items } = useCart()
  const { user, logout, isAdmin } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const count = items && items.length > 0 ? items.reduce((sum, i) => sum + i.quantity, 0) : 0
  const fav = useFavorites()
  const favCount = fav?.ids?.length || 0

  const handleLogout = async () => {
    await logout()
  }

  return (
    <>
      {/* Header with brand, nav, and cart badge; extracted for reuse and clarity */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="app-container flex h-16 items-center justify-between">
          {/* Brand: uses primary color for recognition without overwhelming the UI */}
          <Link to="/" className="text-lg font-bold text-[var(--brand-primary)] sm:text-xl">E‑Com</Link>
          
          <div className="flex items-center gap-4">
            {/*
              Navigation tabs
              - Mobile: pill-style buttons for clear affordance and larger touch targets.
              - Desktop: understated text with a thin underline indicator for the active route.
              Both share a single markup using responsive Tailwind classes and NavLink active state.
            */}
            <nav
              className="-mx-2 flex max-w-full items-center gap-2 overflow-x-auto px-2 text-sm sm:gap-4 snap-x"
              aria-label="Primary"
            >
              {[
                { to: '/products', label: 'Products' },
                { to: '/compare', label: 'Compare' },
                { to: '/checkout', label: 'Checkout' },
                ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
              ].map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  // Mobile: pill with brand fill when active; Desktop: underline indicator when active
                  className={({ isActive }) => [
                    'relative snap-start whitespace-nowrap rounded-full px-3 py-1.5 transition-colors sm:rounded-none sm:px-2 sm:py-3',
                    isActive
                      ? 'bg-[var(--brand-primary)] text-white sm:bg-transparent sm:text-[var(--brand-primary)] sm:after:absolute sm:after:inset-x-2 sm:after:bottom-0 sm:after:h-0.5 sm:after:rounded-full sm:after:bg-[var(--brand-primary)]'
                      : 'text-gray-700 hover:text-[var(--brand-primary)] sm:after:absolute sm:after:inset-x-2 sm:after:bottom-0 sm:after:h-0.5 sm:after:bg-transparent'
                  ].join(' ')}
                >
                  {item.label}
                </NavLink>
              ))}
              {/* Wishlist */}
              <NavLink
                className={({ isActive }) => [
                  'relative snap-start whitespace-nowrap rounded-full px-3 py-1.5 transition-colors sm:rounded-none sm:px-2 sm:py-3',
                  isActive
                    ? 'bg-[var(--brand-primary)] text-white sm:bg-transparent sm:text-[var(--brand-primary)] sm:after:absolute sm:after:inset-x-2 sm:after:bottom-0 sm:after:h-0.5 sm:after:rounded-full sm:after:bg-[var(--brand-primary)]'
                    : 'text-gray-700 hover:text-[var(--brand-primary)] sm:after:absolute sm:after:inset-x-2 sm:after:bottom-0 sm:after:h-0.5 sm:after:bg-transparent'
                ].join(' ')}
                to="/wishlist"
              >
                Wishlist
                {favCount > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] font-semibold text-white">{favCount}</span>
                )}
              </NavLink>
              {/* Cart kept as a link with a subtle badge; follows the same active styles for consistency */}
              <NavLink
                className={({ isActive }) => [
                  'relative snap-start whitespace-nowrap rounded-full px-3 py-1.5 transition-colors sm:rounded-none sm:px-2 sm:py-3',
                  isActive
                    ? 'bg-[var(--brand-primary)] text-white sm:bg-transparent sm:text-[var(--brand-primary)] sm:after:absolute sm:after:inset-x-2 sm:after:bottom-0 sm:after:h-0.5 sm:after:rounded-full sm:after:bg-[var(--brand-primary)]'
                    : 'text-gray-700 hover:text-[var(--brand-primary)] sm:after:absolute sm:after:inset-x-2 sm:after:bottom-0 sm:after:h-0.5 sm:after:bg-transparent'
                ].join(' ')}
                to="/cart"
                aria-label="Cart"
              >
                Cart
                {count > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] font-semibold text-white">{count}</span>
                )}
              </NavLink>
            </nav>

            {/* Auth section */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Hi, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-800"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm bg-[var(--brand-primary)] text-white px-3 py-1.5 rounded-md hover:bg-blue-700"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
