import React, { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { api } from '../utils/api';
import type { Product } from '../utils/api';

export type Category = {
  id: number | string;
  name: string;
  slug: string;
  image?: string;
};

interface CategoryContextType {
  categories: Category[];
  loading: boolean;
  error: string | null;
  refreshCategories: () => Promise<void>;
  getProductsByCategory: (categoryId: number | string, page?: number, limit?: number) => Promise<Product[]>;
}

const CategoryContext = createContext<CategoryContextType>({
  categories: [],
  loading: false,
  error: null,
  refreshCategories: async () => {},
  getProductsByCategory: async () => [],
});

export const useCategories = () => useContext(CategoryContext);

interface CategoryProviderProps {
  children: ReactNode;
}

export const CategoryProvider: React.FC<CategoryProviderProps> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadCategories = async () => {
    setLoading(true);
    setError(null);
    
    try {
      // Since we're updating the API, we'll use the getProducts API and extract categories
      const response = await api.getProducts();
      
      if (response.success && response.data?.products) {
        // Extract unique categories from products
        const uniqueCategories = new Map<string, Category>();
        
        response.data.products.forEach(product => {
          if (product.Categories) {
            product.Categories.forEach(category => {
              if (!uniqueCategories.has(category.name)) {
                uniqueCategories.set(category.name, {
                  id: uniqueCategories.size + 1, // Generate sequential IDs
                  name: category.name,
                  slug: category.name.toLowerCase().replace(/\s+/g, '-'),
                  image: product.images?.[0] || ''
                });
              }
            });
          }
        });
        
        setCategories(Array.from(uniqueCategories.values()));
      } else {
        setError(response.error || 'Failed to load categories');
      }
    } catch (err) {
      console.error('Error loading categories:', err);
      setError('Failed to load categories. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const getProductsByCategory = async (categoryId: number | string, page = 1, limit = 10): Promise<Product[]> => {
    try {
      const response = await api.getProducts({
        category: typeof categoryId === 'string' ? categoryId : String(categoryId),
        page,
        limit
      });
      
      if (response.success && response.data?.products) {
        return response.data.products;
      }
      
      return [];
    } catch (err) {
      console.error('Error fetching products by category:', err);
      return [];
    }
  };

  useEffect(() => {
    loadCategories();
  }, []);

  return (
    <CategoryContext.Provider
      value={{
        categories,
        loading,
        error,
        refreshCategories: loadCategories,
        getProductsByCategory,
      }}
    >
      {children}
    </CategoryContext.Provider>
  );
};

// Export only the provider, not the context directly
export { CategoryContext };

export default CategoryContext;
