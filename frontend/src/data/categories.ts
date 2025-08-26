/*
  Mock categories for the phone store homepage.
  These are used to help users quickly browse by interest.
*/

export type Category = {
  id: string
  name: string
  slug: string
  image: string
}

export const CATEGORIES: Category[] = [
  { id: 'flagship', name: 'Flagship', slug: 'flagship', image: 'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?auto=format&fit=crop&w=1200&q=80' },
  { id: 'camera', name: 'Best Camera', slug: 'camera', image: 'https://images.unsplash.com/photo-1503602642458-232111445657?auto=format&fit=crop&w=1200&q=80' },
  { id: 'budget', name: 'Budget', slug: 'budget', image: 'https://images.unsplash.com/photo-1480694313141-fce5e697ee25?auto=format&fit=crop&w=1200&q=80' },
  { id: 'battery', name: 'Long Battery', slug: 'battery', image: 'https://images.unsplash.com/photo-1470859624578-4bb57890378a?auto=format&fit=crop&w=1200&q=80' },
]
