export default function Footer() {
  return (
  // Footer: quiet tone with neutral text and border using theme tokens
  <footer className="mt-16 border-t border-[var(--border)] py-10 text-sm text-gray-500">
      <div className="app-container flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
        <p>© {new Date().getFullYear()} PhoneStore. All rights reserved.</p>
        <p className="opacity-80">Built with React + Tailwind.</p>
      </div>
    </footer>
  )
}
