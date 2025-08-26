/*
  Mock product data for the phone store.
  - Products include specs, images, and multi-angle arrays.
  - Image URLs are Unsplash for realistic visuals; swap with your assets for production.
*/

export type ProductSpec = {
  display: string
  chipset: string
  ram: string
  storage: string
  camera: string
  battery: string
  connectivity: string
  waterproof?: string
  weight?: string
}

export type Tag = 'Best for Gaming' | 'Best for Video Streaming' | 'Budget-Friendly' | 'Best Camera' | 'Long Battery'

export type Product = {
  id: string
  name: string
  brand: string
  price: number
  currency: 'USD'
  thumbnail: string
  images: string[]
  featured?: boolean
  premium?: boolean
  model3dUrl?: string
  view360?: string[]
  specs: ProductSpec
  tags?: Tag[]
}

export const BRANDS = [
  'Apple', 'Samsung', 'Google', 'OnePlus', 'Xiaomi', 'Nothing', 'Oppo', 'Motorola'
] as const

const IMG = {
  a: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80',
  b: 'https://images.unsplash.com/photo-1510552776732-01acc9a4c36e?auto=format&fit=crop&w=1200&q=80',
  c: 'https://images.unsplash.com/photo-1461749280684-dccba630e2f6?auto=format&fit=crop&w=1200&q=80',
  d: 'https://images.unsplash.com/photo-1470859624578-4bb57890378a?auto=format&fit=crop&w=1200&q=80',
  e: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80',
  f: 'https://images.unsplash.com/photo-1480694313141-fce5e697ee25?auto=format&fit=crop&w=1200&q=80',
  g: 'https://images.unsplash.com/photo-1472162072942-cd5147eb3902?auto=format&fit=crop&w=1200&q=80',
}

type Seed = {
  id: string
  name: string
  brand: typeof BRANDS[number]
  price: number
  featured?: boolean
  premium?: boolean
  tags: Tag[]
}

const SEEDS: Seed[] = [
  // Apple (4)
  { id: 'iphone-15-pro', name: 'iPhone 15 Pro', brand: 'Apple', price: 1099, featured: true, premium: true, tags: ['Best Camera','Best for Video Streaming'] },
  { id: 'iphone-15', name: 'iPhone 15', brand: 'Apple', price: 799, tags: ['Best for Video Streaming'] },
  { id: 'iphone-14', name: 'iPhone 14', brand: 'Apple', price: 599, tags: ['Budget-Friendly'] },
  { id: 'iphone-se-3', name: 'iPhone SE (3rd gen)', brand: 'Apple', price: 429, tags: ['Budget-Friendly'] },
  // Samsung (4)
  { id: 'galaxy-s24-ultra', name: 'Galaxy S24 Ultra', brand: 'Samsung', price: 1199, featured: true, tags: ['Best for Gaming','Best Camera'] },
  { id: 'galaxy-s24', name: 'Galaxy S24', brand: 'Samsung', price: 899, tags: ['Best for Gaming','Long Battery'] },
  { id: 'galaxy-a55', name: 'Galaxy A55', brand: 'Samsung', price: 449, tags: ['Budget-Friendly'] },
  { id: 'galaxy-z-flip5', name: 'Galaxy Z Flip5', brand: 'Samsung', price: 999, tags: ['Best for Video Streaming'] },
  // Google (3)
  { id: 'pixel-9-pro', name: 'Pixel 9 Pro', brand: 'Google', price: 999, tags: ['Best for Video Streaming','Best Camera'] },
  { id: 'pixel-9', name: 'Pixel 9', brand: 'Google', price: 799, tags: ['Best for Video Streaming'] },
  { id: 'pixel-8a', name: 'Pixel 8a', brand: 'Google', price: 499, tags: ['Budget-Friendly'] },
  // OnePlus (3)
  { id: 'oneplus-12', name: 'OnePlus 12', brand: 'OnePlus', price: 799, tags: ['Best for Gaming'] },
  { id: 'oneplus-12r', name: 'OnePlus 12R', brand: 'OnePlus', price: 499, tags: ['Budget-Friendly','Best for Gaming'] },
  { id: 'oneplus-nord-3', name: 'OnePlus Nord 3', brand: 'OnePlus', price: 429, tags: ['Budget-Friendly'] },
  // Xiaomi (3)
  { id: 'xiaomi-14', name: 'Xiaomi 14', brand: 'Xiaomi', price: 699, tags: ['Best for Gaming','Long Battery'] },
  { id: 'redmi-note-13', name: 'Redmi Note 13', brand: 'Xiaomi', price: 249, tags: ['Budget-Friendly','Long Battery'] },
  { id: 'poco-f6', name: 'POCO F6', brand: 'Xiaomi', price: 429, tags: ['Best for Gaming'] },
  // Nothing (3)
  { id: 'nothing-phone-2', name: 'Nothing Phone (2)', brand: 'Nothing', price: 599, tags: ['Best for Video Streaming'] },
  { id: 'nothing-phone-2a', name: 'Nothing Phone (2a)', brand: 'Nothing', price: 399, tags: ['Budget-Friendly'] },
  { id: 'nothing-phone-1', name: 'Nothing Phone (1)', brand: 'Nothing', price: 349, tags: ['Budget-Friendly'] },
  // Oppo (3)
  { id: 'oppo-find-x7', name: 'OPPO Find X7', brand: 'Oppo', price: 899, tags: ['Best Camera'] },
  { id: 'oppo-reno12', name: 'OPPO Reno12', brand: 'Oppo', price: 549, tags: ['Best for Video Streaming'] },
  { id: 'oppo-a79', name: 'OPPO A79', brand: 'Oppo', price: 289, tags: ['Budget-Friendly'] },
  // Motorola (4)
  { id: 'moto-edge-50-pro', name: 'Motorola Edge 50 Pro', brand: 'Motorola', price: 699, tags: ['Best for Video Streaming'] },
  { id: 'moto-razr-40', name: 'Motorola Razr 40', brand: 'Motorola', price: 799, tags: ['Best for Video Streaming'] },
  { id: 'moto-g84', name: 'Moto G84', brand: 'Motorola', price: 299, tags: ['Budget-Friendly','Long Battery'] },
  { id: 'moto-g54', name: 'Moto G54', brand: 'Motorola', price: 249, tags: ['Budget-Friendly'] },
]

function angles(): string[] { return [IMG.a, IMG.b, IMG.d, IMG.g, IMG.e, IMG.c] }
function gallery(): string[] { return [IMG.a, IMG.b, IMG.c] }

function defaultSpecs(seed: Seed): ProductSpec {
  const high = seed.price >= 900
  const mid = seed.price >= 500 && seed.price < 900
  return {
    display: high ? '6.7" LTPO OLED 120Hz' : mid ? '6.5" AMOLED 120Hz' : '6.5" AMOLED 90Hz',
    chipset: high ? 'Snapdragon 8 Gen 3 / A17 / Tensor G4' : mid ? 'Snapdragon 7+ / Dimensity 8200' : 'Snapdragon 6 / Dimensity 6100+',
    ram: high ? '12GB' : mid ? '8GB' : '6GB',
    storage: high ? '256GB' : mid ? '128GB' : '128GB',
    camera: high ? '50MP + 48MP + 12MP' : mid ? '50MP + 8MP + 2MP' : '48MP + 2MP',
    battery: '5000mAh',
    connectivity: high ? '5G, Wi‑Fi 7, BT 5.3, USB‑C' : mid ? '5G, Wi‑Fi 6, BT 5.3, USB‑C' : '5G, Wi‑Fi 5, BT 5.2, USB‑C',
    waterproof: high ? 'IP68' : mid ? 'IP67' : 'IP54',
    weight: high ? '215g' : mid ? '195g' : '185g',
  }
}

export const PRODUCTS: Product[] = SEEDS.map((s) => ({
  id: s.id,
  name: s.name,
  brand: s.brand,
  price: s.price,
  currency: 'USD',
  thumbnail: gallery()[0],
  images: gallery(),
  featured: s.featured,
  premium: !!s.premium,
  model3dUrl: s.premium ? 'https://modelviewer.dev/shared-assets/models/Astronaut.glb' : undefined,
  view360: angles(),
  specs: defaultSpecs(s),
  tags: s.tags,
}))

export type PriceFilter = { min?: number; max?: number }

export function filterProducts(
  products: Product[],
  opts: { brand?: string; price?: PriceFilter; tag?: Tag }
) {
  return products.filter((p) => {
    const byBrand = opts.brand ? p.brand === opts.brand : true
    const byPriceMin = opts.price?.min != null ? p.price >= opts.price.min : true
    const byPriceMax = opts.price?.max != null ? p.price <= opts.price.max : true
    const byTag = opts.tag ? (p.tags?.includes(opts.tag) ?? false) : true
    return byBrand && byPriceMin && byPriceMax && byTag
  })
}
