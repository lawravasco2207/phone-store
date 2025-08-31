export default function Footer() {
  return (
    // Footer: quiet tone with neutral text and border using theme tokens
    <footer className="mt-16 border-t border-[var(--border)] py-8 sm:py-10 text-sm text-gray-500">
      <div className="app-container flex flex-col items-center gap-4 sm:flex-row sm:justify-between">
        <p className="text-center sm:text-left">© {new Date().getFullYear()} PhoneStore. All rights reserved.</p>
        
        {/* Footer Navigation - better touch targets on mobile */}
        <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-center sm:text-left">
          <a href="#" className="hover:text-[var(--brand-primary)] transition-colors px-2 py-1 sm:px-0 sm:py-0">
            Privacy
          </a>
          <a href="#" className="hover:text-[var(--brand-primary)] transition-colors px-2 py-1 sm:px-0 sm:py-0">
            Terms
          </a>
          <a href="#" className="hover:text-[var(--brand-primary)] transition-colors px-2 py-1 sm:px-0 sm:py-0">
            About
          </a>
          <a href="#" className="hover:text-[var(--brand-primary)] transition-colors px-2 py-1 sm:px-0 sm:py-0">
            Contact
          </a>
        </nav>
        
        <p className="opacity-80 text-center sm:text-left">Built with React + Tailwind.</p>
      </div>
    </footer>
  )
}
