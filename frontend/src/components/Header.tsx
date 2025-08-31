import { Link, NavLink } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { useCart } from './CartContext'
import { useFavorites } from './FavoritesContext'
import { useAuth } from './AuthContext'
import { AuthModal } from './AuthModal'

// Header with brand, nav, and cart badge; extracted for reuse and clarity
export default function Header() {
  const { items } = useCart()
  const { user, logout, isAdmin } = useAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const count = items && items.length > 0 ? items.reduce((sum, i) => sum + i.quantity, 0) : 0
  const fav = useFavorites()
  const favCount = fav?.ids?.length || 0

  // Close mobile menu when window is resized to larger viewport
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) {
        setIsMenuOpen(false)
      }
    }
    
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  // Close mobile menu when clicking outside or after navigation
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (isMenuOpen && !target.closest('.mobile-menu') && !target.closest('.menu-button')) {
        setIsMenuOpen(false)
      }
    }
    
    document.addEventListener('click', handleClickOutside)
    return () => document.removeEventListener('click', handleClickOutside)
  }, [isMenuOpen])
  
  const handleLogout = async () => {
    await logout()
    setIsMenuOpen(false)
  }

  const navItems = [
    { to: '/products', label: 'Products' },
    { to: '/compare', label: 'Compare' },
    { to: '/checkout', label: 'Checkout' },
    ...(isAdmin ? [{ to: '/admin', label: 'Admin' }] : []),
  ]

  return (
    <>
      {/* Header with brand, nav, and cart badge; extracted for reuse and clarity */}
      <header className="sticky top-0 z-40 border-b border-[var(--border)] bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
        <div className="app-container flex h-16 items-center justify-between">
          {/* Brand: uses primary color for recognition without overwhelming the UI */}
          <Link to="/" className="text-lg font-bold text-[var(--brand-primary)] sm:text-xl">E‑Com</Link>
          
          {/* Mobile Hamburger Menu Button */}
          <button 
            className="menu-button md:hidden flex items-center justify-center w-10 h-10 p-2 rounded-md hover:bg-gray-100 transition-colors focus-ring"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            aria-expanded={isMenuOpen}
            aria-label="Toggle navigation menu"
          >
            <svg className="w-6 h-6 text-gray-700" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              {isMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              )}
            </svg>
          </button>
          
          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-4">
            <nav
              className="-mx-2 flex max-w-full items-center gap-2 overflow-x-auto px-2 text-sm sm:gap-4 snap-x"
              aria-label="Primary"
            >
              {navItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) => [
                    'relative snap-start whitespace-nowrap rounded-none px-2 py-3 transition-colors',
                    isActive
                      ? 'text-[var(--brand-primary)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--brand-primary)]'
                      : 'text-gray-700 hover:text-[var(--brand-primary)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-transparent'
                  ].join(' ')}
                >
                  {item.label}
                </NavLink>
              ))}
              
              {/* Wishlist */}
              <NavLink
                className={({ isActive }) => [
                  'relative snap-start whitespace-nowrap rounded-none px-2 py-3 transition-colors',
                  isActive
                    ? 'text-[var(--brand-primary)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--brand-primary)]'
                    : 'text-gray-700 hover:text-[var(--brand-primary)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-transparent'
                ].join(' ')}
                to="/wishlist"
              >
                Wishlist
                {favCount > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] font-semibold text-white">{favCount}</span>
                )}
              </NavLink>
              
              {/* Cart kept as a link with a subtle badge */}
              <NavLink
                className={({ isActive }) => [
                  'relative snap-start whitespace-nowrap rounded-none px-2 py-3 transition-colors',
                  isActive
                    ? 'text-[var(--brand-primary)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:rounded-full after:bg-[var(--brand-primary)]'
                    : 'text-gray-700 hover:text-[var(--brand-primary)] after:absolute after:inset-x-2 after:bottom-0 after:h-0.5 after:bg-transparent'
                ].join(' ')}
                to="/cart"
                aria-label="Cart"
              >
                Cart
                {count > 0 && (
                  <span className="absolute -right-3 -top-2 rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] font-semibold text-white">{count}</span>
                )}
              </NavLink>
            </nav> m

            {/* Auth section */}
            <div className="flex items-center gap-2">
              {user ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-700">Hi, {user.name}</span>
                  <button
                    onClick={handleLogout}
                    className="text-sm text-gray-600 hover:text-gray-800 focus-ring"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setShowAuthModal(true)}
                  className="text-sm bg-[var(--brand-primary)] text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors focus-ring"
                >
                  Sign In
                </button>
              )}
            </div>
          </div>
          
          {/* Show key navigation items on mobile even when menu closed */}
          <div className="flex md:hidden items-center gap-3">
            {/* Mobile Wishlist Icon */}
            <NavLink 
              to="/wishlist"
              className={({ isActive }) => 
                `relative p-2 rounded-full ${isActive ? 'text-[var(--brand-primary)]' : 'text-gray-700'}`
              }
              aria-label="Wishlist"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              {favCount > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] font-semibold text-white min-w-[16px] h-4 flex items-center justify-center">{favCount}</span>
              )}
            </NavLink>
            
            {/* Mobile Cart Icon */}
            <NavLink 
              to="/cart"
              className={({ isActive }) => 
                `relative p-2 rounded-full ${isActive ? 'text-[var(--brand-primary)]' : 'text-gray-700'}`
              }
              aria-label="Cart"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              {count > 0 && (
                <span className="absolute -right-1 -top-1 rounded-full bg-[var(--brand-primary)] px-1.5 text-[10px] font-semibold text-white min-w-[16px] h-4 flex items-center justify-center">{count}</span>
              )}
            </NavLink>
          </div>
        </div>
        
        {/* Mobile Menu Overlay */}
        <div 
          className={`mobile-menu fixed inset-0 bg-black/50 backdrop-blur-sm md:hidden transition-opacity duration-300 z-30 ${
            isMenuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
          }`}
          aria-hidden={!isMenuOpen}
        >
          <div 
            className={`bg-white w-4/5 max-w-sm h-full shadow-xl transform transition-transform duration-300 ease-in-out ${
              isMenuOpen ? 'translate-x-0' : '-translate-x-full'
            }`}
          >
            <div className="p-5 space-y-6">
              <div className="flex items-center justify-between">
                <Link 
                  to="/" 
                  className="text-xl font-bold text-[var(--brand-primary)]"
                  onClick={() => setIsMenuOpen(false)}
                >
                  E‑Com
                </Link>
                <button 
                  className="p-2 rounded-full hover:bg-gray-100 focus-ring"
                  onClick={() => setIsMenuOpen(false)}
                  aria-label="Close menu"
                >
                  <svg className="w-6 h-6 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Mobile Navigation Links */}
              <nav className="space-y-1">
                {navItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => [
                      'block py-3 px-4 rounded-md text-base font-medium transition-colors',
                      isActive
                        ? 'bg-[var(--brand-primary-50)] text-[var(--brand-primary)]'
                        : 'text-gray-700 hover:bg-gray-50 hover:text-[var(--brand-primary)]'
                    ].join(' ')}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    {item.label}
                  </NavLink>
                ))}
                <NavLink
                  to="/wishlist"
                  className={({ isActive }) => [
                    'block py-3 px-4 rounded-md text-base font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--brand-primary-50)] text-[var(--brand-primary)]'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[var(--brand-primary)]'
                  ].join(' ')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Wishlist {favCount > 0 && `(${favCount})`}
                </NavLink>
                <NavLink
                  to="/cart"
                  className={({ isActive }) => [
                    'block py-3 px-4 rounded-md text-base font-medium transition-colors',
                    isActive
                      ? 'bg-[var(--brand-primary-50)] text-[var(--brand-primary)]'
                      : 'text-gray-700 hover:bg-gray-50 hover:text-[var(--brand-primary)]'
                  ].join(' ')}
                  onClick={() => setIsMenuOpen(false)}
                >
                  Cart {count > 0 && `(${count})`}
                </NavLink>
              </nav>
              
              {/* Mobile Auth Section */}
              <div className="pt-4 border-t border-gray-200">
                {user ? (
                  <div className="space-y-3">
                    <p className="text-sm text-gray-700">Logged in as <span className="font-medium">{user.name}</span></p>
                    <button
                      onClick={handleLogout}
                      className="w-full py-3 px-4 rounded-md text-base font-medium text-gray-700 hover:bg-gray-50 transition-colors focus-ring"
                    >
                      Logout
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => {
                      setShowAuthModal(true)
                      setIsMenuOpen(false)
                    }}
                    className="w-full py-3 text-center bg-[var(--brand-primary)] text-white rounded-md hover:bg-[var(--brand-primary-700)] transition-colors focus-ring"
                  >
                    Sign In
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </>
  )
}
