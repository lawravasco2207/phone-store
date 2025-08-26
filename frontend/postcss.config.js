// Tailwind v4 PostCSS plugin with ESM imports (package.json has type: "module")
import tailwindcss from '@tailwindcss/postcss'
import autoprefixer from 'autoprefixer'

export default {
  plugins: [tailwindcss(), autoprefixer()],
}
