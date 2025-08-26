## Phone Store Frontend (React + Vite + Tailwind)

This is a mock-driven e-commerce frontend for a phone store. It uses React functional components with hooks, TypeScript, React Router, and TailwindCSS.

Features scaffolded:
- Homepage with featured products and categories
- Product listing with brand/price filters
- Product details with image-based 360° viewer and optional 3D model
- Comparison tool for 2–3 products with visual diff highlighting
- One-page checkout with client-side validation

How to run:

1. Install dependencies
  - Already installed in this workspace. If needed: npm install
2. Start dev server
  - npm run dev
3. Open the printed localhost URL in your browser.

Testing the app manually:
- Navigate to Products and test filtering by brand and price.
- Open a product to interact with the 360° viewer; use drag or arrow keys.
- On premium products, the 3D model loads lazily (requires internet to fetch web component).
- Use Compare to select up to 3 phones and review highlighted differences.
- Try Checkout and validate the form errors for missing/invalid fields.

Project structure:
- src/components: Reusable UI components (ProductCard, Viewer360)
- src/pages: Route pages (Home, ProductsList, ProductDetail, Compare, Checkout)
- src/data: Mock data (products, categories)
- src/utils: Small helpers (formatters)

Common tips and pitfalls:
- Keep components pure and derive state from props when possible.
- For 360° images, use consistent frame counts (24–36) and ordered URLs.
- Defer loading heavy assets (3D models) until needed.
- Validate user inputs aggressively on the client, then re-validate on the server when backend is wired.

Next steps:
- Add unit tests (e.g., with Vitest/React Testing Library).
- Hook up a real backend and replace mock data with API calls.
- Add cart state, persistence, and order summary based on selections.

Image sources and attribution:
- Product and category images use Unsplash photos for realistic visuals during prototyping.
- Replace URLs in `src/data/products.ts` and `src/data/categories.ts` with your own or manufacturer images before launch.
