// Mock catalog data for testing
export interface Product {
  id: string;
  name: string;
  price: number;
  categories: string[];
  description?: string;
  imageUrl?: string;
  sales: number;
  rating?: number;
  stock?: number;
}

export const Catalog = {
  PRODUCTS: [
    {
      id: '1',
      name: 'Smartphone XYZ',
      price: 699.99,
      categories: ['Electronics', 'Phones'],
      description: 'Latest smartphone with amazing features',
      imageUrl: '/images/smartphone.jpg',
      sales: 1245,
      rating: 4.5,
      stock: 50
    },
    {
      id: '2',
      name: 'Laptop Pro',
      price: 1299.99,
      categories: ['Electronics', 'Computers'],
      description: 'Powerful laptop for professionals',
      imageUrl: '/images/laptop.jpg',
      sales: 876,
      rating: 4.7,
      stock: 25
    },
    {
      id: '3',
      name: 'Wireless Earbuds',
      price: 129.99,
      categories: ['Electronics', 'Audio'],
      description: 'True wireless earbuds with noise cancellation',
      imageUrl: '/images/earbuds.jpg',
      sales: 2345,
      rating: 4.3,
      stock: 100
    },
    {
      id: '4',
      name: 'Budget Phone',
      price: 299.99,
      categories: ['Electronics', 'Phones'],
      description: 'Affordable smartphone with good features',
      imageUrl: '/images/budget-phone.jpg',
      sales: 932,
      rating: 3.9,
      stock: 75
    },
    {
      id: '5',
      name: 'Premium Headphones',
      price: 349.99,
      categories: ['Electronics', 'Audio'],
      description: 'Over-ear headphones with premium sound',
      imageUrl: '/images/headphones.jpg',
      sales: 1532,
      rating: 4.8,
      stock: 40
    }
  ]
};

// Filter products based on criteria
export function filterProducts(
  products: Product[], 
  filters: { 
    categories?: string[], 
    price?: { min?: number, max?: number },
    search?: string
  }
): Product[] {
  return products.filter(product => {
    // Filter by categories
    if (filters.categories && filters.categories.length > 0) {
      if (!filters.categories.some(cat => product.categories.includes(cat))) {
        return false;
      }
    }
    
    // Filter by price range
    if (filters.price) {
      if (filters.price.min !== undefined && product.price < filters.price.min) {
        return false;
      }
      if (filters.price.max !== undefined && product.price > filters.price.max) {
        return false;
      }
    }
    
    // Filter by search term
    if (filters.search && filters.search.trim() !== '') {
      const searchLower = filters.search.toLowerCase();
      const nameMatch = product.name.toLowerCase().includes(searchLower);
      const descMatch = product.description?.toLowerCase().includes(searchLower);
      if (!nameMatch && !descMatch) {
        return false;
      }
    }
    
    return true;
  });
}

// Sort products by different criteria
export function sortProducts(
  products: Product[],
  sortBy: 'price-asc' | 'price-desc' | 'name-asc' | 'name-desc' | 'best-sellers' | 'rating'
): Product[] {
  const productsCopy = [...products];
  
  switch (sortBy) {
    case 'price-asc':
      return productsCopy.sort((a, b) => a.price - b.price);
    case 'price-desc':
      return productsCopy.sort((a, b) => b.price - a.price);
    case 'name-asc':
      return productsCopy.sort((a, b) => a.name.localeCompare(b.name));
    case 'name-desc':
      return productsCopy.sort((a, b) => b.name.localeCompare(a.name));
    case 'best-sellers':
      return productsCopy.sort((a, b) => b.sales - a.sales);
    case 'rating':
      return productsCopy.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    default:
      return productsCopy;
  }
}
