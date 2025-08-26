/*
  Mock Data Module (Future-ready, AI-friendly)
  - Provides: categories, products, tags, and helper utilities for filtering/sorting.
  - Design goals:
    * Multi-category catalog beyond phones (Electronics, Fashion, Home & Kitchen, Beauty, Sports & Outdoors)
    * Every product includes 6–8 images used for a 360° viewer, plus optional video/GIF
    * Ratings, tags (Trending, New Arrival, Budget-Friendly, Best for Gaming, etc.)
    * Fields for popularity, createdAt, sales to support sorting: popularity/newest/best sellers
    * Generic specs object to enable cross-category comparisons
    * Typed and commented for learning; drop-in ready until backend arrives

  Tip (AI-readiness):
  - This structure anticipates recommendation systems: tags, categories, ratings, popularity, and sales are
    features commonly used by ranking models. Keep these updated as you build interactions.
*/

// -----------------------------
// Type definitions
// -----------------------------

export type CategoryName =
  | 'Electronics'
  | 'Fashion'
  | 'Home & Kitchen'
  | 'Beauty'
  | 'Sports & Outdoors'

export type Tag =
  | 'Best for Gaming'
  | 'Trending'
  | 'Budget-Friendly'
  | 'New Arrival'
  | 'Best Sellers'
  | 'Long Battery'
  | 'Best Camera'

export type Rating = {
  average: number
  count: number
}

export type Media = {
  images: string[] // 6–8 frames for 360°
  video?: string // optional demo video URL (mp4)
  gif?: string // optional animated GIF URL
}

export type Product = {
  id: string
  name: string
  brand: string
  description: string
  price: number
  currency: 'USD'
  categories: CategoryName[]
  tags: Tag[]
  rating: Rating
  media: Media
  thumbnail: string
  view360: string[]
  featured?: boolean
  premium?: boolean // can be used to unlock 3D models or richer media
  model3dUrl?: string
  popularity: number // used for sorting by popularity
  sales: number // used for best-sellers sorting
  createdAt: string // used for newest sorting
  specs: Record<string, string | number | boolean>
}

export type PriceFilter = { min?: number; max?: number }
export type SortKey = 'popularity' | 'newest' | 'best-sellers' | 'price-asc' | 'price-desc' | 'rating-desc'

// -----------------------------
// Category catalog
// -----------------------------

export const CATEGORIES: { id: string; name: CategoryName; slug: string; image: string }[] = [
  { id: 'electronics', name: 'Electronics', slug: 'electronics', image: 'https://images.unsplash.com/photo-1510552776732-01acc9a4c36e?auto=format&fit=crop&w=1200&q=80' },
  { id: 'fashion', name: 'Fashion', slug: 'fashion', image: 'https://images.unsplash.com/photo-1520975682031-6d3c3a4b4551?auto=format&fit=crop&w=1200&q=80' },
  { id: 'home-kitchen', name: 'Home & Kitchen', slug: 'home-kitchen', image: 'https://images.unsplash.com/photo-1501045661006-fcebe0257c3f?auto=format&fit=crop&w=1200&q=80' },
  { id: 'beauty', name: 'Beauty', slug: 'beauty', image: 'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1200&q=80' },
  { id: 'sports-outdoors', name: 'Sports & Outdoors', slug: 'sports-outdoors', image: 'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1200&q=80' },
]

// -----------------------------
// High-quality product image pools from Unsplash/Pexels (360° ready)
// Each pool contains 8+ carefully selected product images for realistic 360° views
// -----------------------------

const IMG = {
  electronics: [
    'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1400&q=80', // iPhone front
    'https://images.unsplash.com/photo-1512499617640-c74ae3a79d37?auto=format&fit=crop&w=1400&q=80', // iPhone side
    'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?auto=format&fit=crop&w=1400&q=80', // headphones front
    'https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&w=1400&q=80', // headphones side
    'https://images.unsplash.com/photo-1583225272834-9a56a5ad3f2c?auto=format&fit=crop&w=1400&q=80', // camera lens
    'https://images.unsplash.com/photo-1518779578993-ec3579fee39f?auto=format&fit=crop&w=1400&q=80', // gaming setup
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=1400&q=80', // smartwatch
    'https://images.unsplash.com/photo-1498049794561-7780e7231661?auto=format&fit=crop&w=1400&q=80', // laptop
  ],
  fashion: [
    'https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=1400&q=80', // sneakers front
    'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?auto=format&fit=crop&w=1400&q=80', // sneakers side
    'https://images.unsplash.com/photo-1560769629-975ec94e6a86?auto=format&fit=crop&w=1400&q=80', // jacket front
    'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?auto=format&fit=crop&w=1400&q=80', // jacket detail
    'https://images.unsplash.com/photo-1491553895911-0055eca6402d?auto=format&fit=crop&w=1400&q=80', // watch
    'https://images.unsplash.com/photo-1549298916-b41d501d3772?auto=format&fit=crop&w=1400&q=80', // sunglasses
    'https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?auto=format&fit=crop&w=1400&q=80', // backpack
    'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=1400&q=80', // shoes detail
  ],
  home: [
    'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&w=1400&q=80', // blender
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1400&q=80', // coffee maker
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1400&q=80', // air fryer
    'https://images.unsplash.com/photo-1449247709967-d4461a6a6103?auto=format&fit=crop&w=1400&q=80', // kitchen appliance
    'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80', // stand mixer
    'https://images.unsplash.com/photo-1565814329452-e1efa11c5b89?auto=format&fit=crop&w=1400&q=80', // toaster
    'https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?auto=format&fit=crop&w=1400&q=80', // kitchen scale
    'https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?auto=format&fit=crop&w=1400&q=80', // cookware
  ],
  beauty: [
    'https://images.unsplash.com/photo-1512496015851-a90fb38ba796?auto=format&fit=crop&w=1400&q=80', // skincare bottles
    'https://images.unsplash.com/photo-1570194065650-d99fb4bba03f?auto=format&fit=crop&w=1400&q=80', // cosmetics set
    'https://images.unsplash.com/photo-1556228724-4b6379cd7a7f?auto=format&fit=crop&w=1400&q=80', // perfume bottle
    'https://images.unsplash.com/photo-1515378791036-0648a3ef77b2?auto=format&fit=crop&w=1400&q=80', // makeup palette
    'https://images.unsplash.com/photo-1596462502278-27bfdc403348?auto=format&fit=crop&w=1400&q=80', // hair dryer
    'https://images.unsplash.com/photo-1570158268183-d296b2892211?auto=format&fit=crop&w=1400&q=80', // beauty tools
    'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?auto=format&fit=crop&w=1400&q=80', // serum bottles
    'https://images.unsplash.com/photo-1571782742478-0816a4773e69?auto=format&fit=crop&w=1400&q=80', // face cream jars
  ],
  sports: [
    'https://images.unsplash.com/photo-1571019613914-85f342c6a11e?auto=format&fit=crop&w=1400&q=80', // yoga mat rolled
    'https://images.unsplash.com/photo-1599058917212-d750089bc07e?auto=format&fit=crop&w=1400&q=80', // yoga mat flat
    'https://images.unsplash.com/photo-1556656793-08538906a9f8?auto=format&fit=crop&w=1400&q=80', // fitness watch
    'https://images.unsplash.com/photo-1518098268026-4e89f1a2cd8e?auto=format&fit=crop&w=1400&q=80', // running shoes
    'https://images.unsplash.com/photo-1517649763962-0c623066013b?auto=format&fit=crop&w=1400&q=80', // dumbbells
    'https://images.unsplash.com/photo-1549049950-48d5887197e8?auto=format&fit=crop&w=1400&q=80', // resistance bands
    'https://images.unsplash.com/photo-1503341455253-b2e723bb3dbb?auto=format&fit=crop&w=1400&q=80', // water bottle
    'https://images.unsplash.com/photo-1517438476312-10d79c077509?auto=format&fit=crop&w=1400&q=80', // gym bag
  ],
} as const

// Helper to make a 6–8 frame 360 sequence from a pool
function frames(pool: readonly string[], count = 8): string[] {
  const out: string[] = []
  for (let i = 0; i < count; i++) out.push(pool[i % pool.length])
  return out
}

// Short alias to build the media structure
function mediaFrom(pool: readonly string[]): Media {
  const seq = frames(pool, 8)
  return {
    images: seq,
    video: undefined,
    gif: undefined,
  }
}

// -----------------------------
// Product seeds
// -----------------------------

const NOW = Date.now()
const daysAgo = (n: number) => new Date(NOW - n * 86400000).toISOString()

export const PRODUCTS: Product[] = [
  // Electronics Category - Premium Tech Products
  {
    id: 'el-phone-ultimate',
    name: 'Ultimate Pro Smartphone 15',
    brand: 'Apex',
    description: 'Next-generation flagship phone with LTPO OLED display, AI-powered triple camera system, and all-day battery life. Features advanced computational photography and 5G connectivity.',
    price: 1099,
    currency: 'USD',
    categories: ['Electronics'],
    tags: ['Trending', 'Best Camera', 'New Arrival'],
    rating: { average: 4.7, count: 1289 },
    media: mediaFrom(IMG.electronics),
    thumbnail: IMG.electronics[0],
    view360: frames(IMG.electronics, 8),
    featured: true,
    premium: true,
    model3dUrl: 'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
    popularity: 98,
    sales: 8790,
    createdAt: daysAgo(15),
    specs: {
      display: '6.7" LTPO OLED 120Hz',
      chipset: 'Apex X3 Pro',
      ram: '12GB',
      storage: '256GB',
      camera: '50MP Main + 48MP Ultra + 12MP Tele',
      battery: '5000mAh with 67W charging',
      connectivity: '5G, Wi‑Fi 7, Bluetooth 5.3, USB‑C',
      waterproof: 'IP68',
      weight: '210g',
      colors: 'Midnight, Silver, Gold, Deep Purple',
    },
  },
  {
    id: 'el-headphones-anc',
    name: 'Nimbus ANC Pro Headphones',
    brand: 'Nimbus Audio',
    description: 'Premium over-ear headphones with industry-leading noise cancellation, spatial audio, and 35-hour battery life. Perfect for work, travel, and entertainment.',
    price: 349,
    currency: 'USD',
    categories: ['Electronics'],
    tags: ['Trending', 'Best for Gaming'],
    rating: { average: 4.6, count: 542 },
    media: mediaFrom(IMG.electronics),
    thumbnail: IMG.electronics[2],
    view360: frames(IMG.electronics, 8),
    popularity: 86,
    sales: 4120,
    createdAt: daysAgo(30),
    specs: {
      driver: '40mm custom dynamic',
      codec: 'AAC, LDAC, aptX HD',
      battery: '35h ANC on, 50h ANC off',
      weight: '260g',
      noise_cancelling: 'Hybrid ANC up to 30dB',
      connectivity: 'Bluetooth 5.3, USB-C, 3.5mm',
      colors: 'Black, Silver, Navy Blue',
    },
  },
  {
    id: 'el-console-x',
    name: 'Nova Console X Pro',
    brand: 'Nova Gaming',
    description: 'Next‑generation gaming console with ray tracing, 4K 120fps gaming, and ultra‑fast NVMe storage. Includes wireless controller and 3-month game subscription.',
    price: 499,
    currency: 'USD',
    categories: ['Electronics'],
    tags: ['Best for Gaming', 'Best Sellers'],
    rating: { average: 4.8, count: 2210 },
    media: { ...mediaFrom(IMG.electronics), video: 'https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4' },
    thumbnail: IMG.electronics[7],
    view360: frames(IMG.electronics, 8),
    featured: true,
    popularity: 99,
    sales: 12500,
    createdAt: daysAgo(120),
    specs: {
      storage: '1TB NVMe SSD',
      ray_tracing: true,
      max_output: '4K 120Hz, 8K 60Hz',
      controllers: '1 wireless included',
      backward_compatibility: 'Full library support',
      dimensions: '301 × 151 × 104 mm',
    },
  },
  {
    id: 'el-laptop-creator',
    name: 'CreatorBook Pro 16',
    brand: 'VisionTech',
    description: 'Professional laptop designed for creators with M2 Pro chip, Liquid Retina XDR display, and all-day battery life. Perfect for video editing, design, and development.',
    price: 2499,
    currency: 'USD',
    categories: ['Electronics'],
    tags: ['New Arrival', 'Best for Gaming'],
    rating: { average: 4.8, count: 892 },
    media: mediaFrom(IMG.electronics),
    thumbnail: IMG.electronics[7],
    view360: frames(IMG.electronics, 8),
    popularity: 91,
    sales: 3200,
    createdAt: daysAgo(45),
    specs: {
      processor: 'M2 Pro 12-core CPU',
      memory: '32GB unified memory',
      storage: '1TB SSD',
      display: '16.2" Liquid Retina XDR',
      graphics: '19-core GPU',
      battery: 'Up to 22 hours',
      ports: '3× Thunderbolt 4, HDMI, SD card',
      weight: '2.15kg',
    },
  },

  // Fashion Category - Trendy Apparel & Accessories
  {
    id: 'fa-sneaker-velocity',
    name: 'Velocity Knit Performance Sneakers',
    brand: 'UrbanStep',
    description: 'Lightweight running sneakers with breathable knit upper, responsive foam midsole, and all-day comfort. Perfect for workouts, running, and casual wear.',
    price: 129,
    currency: 'USD',
    categories: ['Fashion', 'Sports & Outdoors'],
    tags: ['Trending', 'New Arrival'],
    rating: { average: 4.4, count: 320 },
    media: { ...mediaFrom(IMG.fashion), gif: 'https://media.giphy.com/media/Ju7l5y9osyymQ/giphy.gif' },
    thumbnail: IMG.fashion[0],
    view360: frames(IMG.fashion, 8),
    popularity: 74,
    sales: 2680,
    createdAt: daysAgo(10),
    specs: {
      material: 'Breathable knit upper',
      outsole: 'Durable rubber with grip pattern',
      gender: 'Unisex',
      weight: '240g per shoe',
      sizes: '6-13 US',
      colors: 'White/Gray, Black, Navy, Coral',
      cushioning: 'Responsive foam midsole',
    },
  },
  {
    id: 'fa-jacket-aero',
    name: 'AeroShield Performance Windbreaker',
    brand: 'NorthLine',
    description: 'Lightweight windbreaker jacket with water‑repellent finish, packable design, and reflective details. Perfect for running, hiking, and urban adventures.',
    price: 159,
    currency: 'USD',
    categories: ['Fashion', 'Sports & Outdoors'],
    tags: ['Trending', 'Budget-Friendly'],
    rating: { average: 4.2, count: 210 },
    media: mediaFrom(IMG.fashion),
    thumbnail: IMG.fashion[2],
    view360: frames(IMG.fashion, 8),
    popularity: 61,
    sales: 980,
    createdAt: daysAgo(45),
    specs: {
      material: 'Ripstop nylon with DWR coating',
      waterproof: 'DWR water-repellent finish',
      pockets: '2 zip hand pockets, 1 chest pocket',
      packable: 'Packs into own pocket',
      sizes: 'XS-XXL',
      colors: 'Black, Navy, Forest Green, Coral',
    },
  },
  {
    id: 'fa-watch-classic',
    name: 'Heritage Classic Automatic Watch',
    brand: 'Timekeeper',
    description: 'Elegant automatic watch with Swiss movement, sapphire crystal, and genuine leather strap. Timeless design meets modern craftsmanship.',
    price: 599,
    currency: 'USD',
    categories: ['Fashion'],
    tags: ['Best Sellers', 'New Arrival'],
    rating: { average: 4.7, count: 445 },
    media: mediaFrom(IMG.fashion),
    thumbnail: IMG.fashion[4],
    view360: frames(IMG.fashion, 8),
    featured: true,
    popularity: 85,
    sales: 1850,
    createdAt: daysAgo(60),
    specs: {
      movement: 'Swiss automatic',
      case_material: 'Stainless steel',
      crystal: 'Sapphire with AR coating',
      water_resistance: '100m',
      strap: 'Genuine leather',
      case_diameter: '40mm',
      colors: 'Silver/Black, Gold/Brown, Black/Black',
    },
  },

  // Home & Kitchen Category - Smart Appliances
  {
    id: 'hk-blender-pro',
    name: 'KitchenPro Velocity Blender 1500W',
    brand: 'KitchenPro',
    description: 'Professional-grade high‑speed blender with preset programs, self-cleaning function, and BPA-free pitcher. Perfect for smoothies, soups, and nut butters.',
    price: 189,
    currency: 'USD',
    categories: ['Home & Kitchen'],
    tags: ['Best Sellers', 'Budget-Friendly'],
    rating: { average: 4.5, count: 820 },
    media: mediaFrom(IMG.home),
    thumbnail: IMG.home[0],
    view360: frames(IMG.home, 8),
    popularity: 82,
    sales: 7200,
    createdAt: daysAgo(200),
    specs: {
      power: '1500W peak motor',
      jar_capacity: '2L BPA-free Tritan',
      speeds: '10 variable + pulse',
      presets: '6 automatic programs',
      self_cleaning: true,
      warranty: '7 years',
      dimensions: '18 × 22 × 43 cm',
    },
  },
  {
    id: 'hk-airfryer-max',
    name: 'CrispAir Max Digital Air Fryer 6Qt',
    brand: 'CrispAir',
    description: 'Family‑size digital air fryer with smart presets, dishwasher-safe basket, and rapid air technology. Cook healthier meals with up to 85% less oil.',
    price: 139,
    currency: 'USD',
    categories: ['Home & Kitchen'],
    tags: ['Best Sellers', 'Trending'],
    rating: { average: 4.6, count: 1330 },
    media: mediaFrom(IMG.home),
    thumbnail: IMG.home[2],
    view360: frames(IMG.home, 8),
    featured: true,
    popularity: 88,
    sales: 9400,
    createdAt: daysAgo(90),
    specs: {
      capacity: '6Qt (serves 4-6 people)',
      presets: '8 one-touch cooking presets',
      dishwasher_safe: 'Basket and tray',
      power: '1700W with rapid air circulation',
      temperature_range: '180°F - 400°F',
      timer: '60 minutes with auto shut-off',
      dimensions: '35 × 35 × 32 cm',
    },
  },
  {
    id: 'hk-coffee-maker',
    name: 'BrewMaster Pro Coffee Machine',
    brand: 'BrewTech',
    description: 'Programmable drip coffee maker with built-in grinder, thermal carafe, and strength control. Brews perfect coffee from bean to cup.',
    price: 249,
    currency: 'USD',
    categories: ['Home & Kitchen'],
    tags: ['New Arrival', 'Trending'],
    rating: { average: 4.4, count: 567 },
    media: mediaFrom(IMG.home),
    thumbnail: IMG.home[1],
    view360: frames(IMG.home, 8),
    popularity: 79,
    sales: 2890,
    createdAt: daysAgo(35),
    specs: {
      capacity: '12 cups',
      grinder: 'Built-in burr grinder',
      carafe: 'Double-wall thermal',
      programmable: '24-hour programming',
      strength_control: '3 brew strength settings',
      auto_shutoff: '2 hours',
      dimensions: '23 × 35 × 41 cm',
    },
  },

  // Beauty Category - Skincare & Personal Care
  {
    id: 'be-skin-starter',
    name: 'Radiance Complete Skincare Set',
    brand: 'GlowLab',
    description: 'Complete 4-step skincare routine with cleanser, toner, serum, and moisturizer. Formulated with natural ingredients for all skin types.',
    price: 79,
    currency: 'USD',
    categories: ['Beauty'],
    tags: ['New Arrival', 'Trending', 'Budget-Friendly'],
    rating: { average: 4.3, count: 260 },
    media: mediaFrom(IMG.beauty),
    thumbnail: IMG.beauty[0],
    view360: frames(IMG.beauty, 8),
    popularity: 69,
    sales: 1600,
    createdAt: daysAgo(7),
    specs: {
      skin_type: 'All skin types',
      fragrance_free: true,
      set_includes: 'Cleanser, Toner, Serum, Moisturizer',
      key_ingredients: 'Hyaluronic Acid, Vitamin C, Niacinamide',
      size_total: '4 × 50ml bottles',
      cruelty_free: true,
    },
  },
  {
    id: 'be-hair-dryer',
    name: 'SalonX Ionic Hair Dryer Pro',
    brand: 'SalonX Professional',
    description: 'Professional ionic hair dryer with ceramic technology, multiple heat settings, and diffuser attachment. Reduces frizz and enhances shine.',
    price: 129,
    currency: 'USD',
    categories: ['Beauty'],
    tags: ['Best Sellers', 'Trending'],
    rating: { average: 4.6, count: 740 },
    media: mediaFrom(IMG.beauty),
    thumbnail: IMG.beauty[4],
    view360: frames(IMG.beauty, 8),
    popularity: 77,
    sales: 5400,
    createdAt: daysAgo(60),
    specs: {
      power: '1875W AC motor',
      heat_settings: '3 heat + 2 speed settings',
      cool_shot: 'Cold air button',
      ionic_technology: 'Reduces frizz by 75%',
      attachments: 'Diffuser and concentrator',
      weight: '560g',
      cord_length: '2.7m professional cord',
    },
  },
  {
    id: 'be-perfume-luxury',
    name: 'Essence Luxury Eau de Parfum',
    brand: 'Aromatic',
    description: 'Sophisticated fragrance with notes of bergamot, jasmine, and sandalwood. Long-lasting scent that evolves throughout the day.',
    price: 89,
    currency: 'USD',
    categories: ['Beauty'],
    tags: ['New Arrival', 'Best Sellers'],
    rating: { average: 4.5, count: 389 },
    media: mediaFrom(IMG.beauty),
    thumbnail: IMG.beauty[2],
    view360: frames(IMG.beauty, 8),
    popularity: 71,
    sales: 2150,
    createdAt: daysAgo(20),
    specs: {
      fragrance_type: 'Eau de Parfum',
      volume: '50ml',
      top_notes: 'Bergamot, Pink Pepper',
      heart_notes: 'Jasmine, Rose',
      base_notes: 'Sandalwood, Vanilla, Musk',
      longevity: '6-8 hours',
      bottle_design: 'Elegant glass with gold accents',
    },
  },

  // Sports & Outdoors Category - Fitness Equipment
  {
    id: 'sp-yoga-mat',
    name: 'EcoGrip Premium Yoga Mat',
    brand: 'ZenFlex',
    description: 'Eco-friendly yoga mat with superior grip, cushioning, and alignment guides. Made from sustainable TPE material with carrying strap included.',
    price: 49,
    currency: 'USD',
    categories: ['Sports & Outdoors'],
    tags: ['Budget-Friendly', 'Trending'],
    rating: { average: 4.5, count: 1180 },
    media: mediaFrom(IMG.sports),
    thumbnail: IMG.sports[0],
    view360: frames(IMG.sports, 8),
    popularity: 79,
    sales: 6400,
    createdAt: daysAgo(300),
    specs: {
      thickness: '6mm premium cushioning',
      length: '183cm',
      width: '61cm',
      material: 'Eco-friendly TPE',
      weight: '900g',
      grip: 'Non-slip textured surface',
      includes: 'Carrying strap and care guide',
    },
  },
  {
    id: 'sp-smartwatch-fit',
    name: 'FitTrack Pro Smartwatch',
    brand: 'Pulse Fitness',
    description: 'Advanced fitness smartwatch with GPS, heart rate monitoring, and 5-day battery life. Track 100+ sport modes and monitor health metrics.',
    price: 199,
    currency: 'USD',
    categories: ['Sports & Outdoors', 'Electronics'],
    tags: ['New Arrival', 'Best Sellers', 'Long Battery'],
    rating: { average: 4.1, count: 540 },
    media: mediaFrom(IMG.sports),
    thumbnail: IMG.sports[2],
    view360: frames(IMG.sports, 8),
    featured: true,
    popularity: 72,
    sales: 3800,
    createdAt: daysAgo(25),
    specs: {
      gps: 'Built-in GPS + GLONASS',
      battery: '5 days typical use',
      water_resistance: '5 ATM (50m)',
      sensors: 'HR, SpO2, GPS, Accelerometer, Gyroscope',
      display: '1.4" AMOLED always-on',
      sport_modes: '100+ exercise modes',
      compatibility: 'iOS and Android',
    },
  },
  {
    id: 'sp-dumbbells-set',
    name: 'PowerFlex Adjustable Dumbbell Set',
    brand: 'IronCore',
    description: 'Space-saving adjustable dumbbells with quick-change system. Replaces 15 sets of weights with smooth weight transitions from 5-50 lbs per dumbbell.',
    price: 299,
    currency: 'USD',
    categories: ['Sports & Outdoors'],
    tags: ['Best for Gaming', 'Best Sellers'], // Note: "Best for Gaming" used creatively for strength training
    rating: { average: 4.7, count: 892 },
    media: mediaFrom(IMG.sports),
    thumbnail: IMG.sports[4],
    view360: frames(IMG.sports, 8),
    popularity: 86,
    sales: 4200,
    createdAt: daysAgo(150),
    specs: {
      weight_range: '5-50 lbs per dumbbell',
      adjustment_system: 'Quick-select dial',
      increments: '2.5 lb increments',
      total_weight: '100 lbs (pair)',
      dimensions: '40 × 20 × 20 cm (each)',
      material: 'Cast iron with rubber coating',
      warranty: '2 years',
    },
  },
]

// -----------------------------
// Helper utilities: filter + sort (frontend-only; pure functions for testability)
// -----------------------------

export function filterProducts(
  products: Product[],
  opts: {
    categories?: CategoryName[]
    price?: PriceFilter
    tags?: Tag[]
    minRating?: number
    brands?: string[]
  } = {}
) {
  return products.filter((p) => {
    const byCat = opts.categories?.length ? p.categories.some((c) => opts.categories!.includes(c)) : true
    const byMin = opts.price?.min != null ? p.price >= opts.price.min : true
    const byMax = opts.price?.max != null ? p.price <= opts.price.max : true
    const byTag = opts.tags?.length ? p.tags.some((t) => opts.tags!.includes(t)) : true
    const byRating = opts.minRating != null ? p.rating.average >= opts.minRating : true
    const byBrand = opts.brands?.length ? opts.brands.includes(p.brand) : true
    return byCat && byMin && byMax && byTag && byRating && byBrand
  })
}

export function sortProducts(list: Product[], key: SortKey): Product[] {
  const arr = [...list]
  switch (key) {
    case 'popularity':
      return arr.sort((a, b) => b.popularity - a.popularity)
    case 'newest':
      return arr.sort((a, b) => Date.parse(b.createdAt) - Date.parse(a.createdAt))
    case 'best-sellers':
      return arr.sort((a, b) => b.sales - a.sales)
    case 'price-asc':
      return arr.sort((a, b) => a.price - b.price)
    case 'price-desc':
      return arr.sort((a, b) => b.price - a.price)
    case 'rating-desc':
      return arr.sort((a, b) => b.rating.average - a.rating.average)
  }
}

export function getFeatured(products: Product[]) {
  return products.filter((p) => p.featured === true)
}

// Convenience exports grouped for easy imports in pages/components
export const Catalog = {
  CATEGORIES,
  PRODUCTS,
  filterProducts,
  sortProducts,
  getFeatured,
}
