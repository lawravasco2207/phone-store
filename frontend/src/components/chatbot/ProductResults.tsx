import React from 'react';
import type { Product } from '../../utils/api';
import ProductCard from './ProductCard';

interface ProductResultsProps {
  products: Product[];
  onAddToCart: (productId: number) => void;
  onViewDetails: (productId: number) => void;
}

const ProductResults: React.FC<ProductResultsProps> = ({ 
  products, 
  onAddToCart, 
  onViewDetails 
}) => {
  if (!products || products.length === 0) {
    return null;
  }

  return (
    <div className="product-results">
      <div className="products-grid">
        {products.map(product => (
          <ProductCard 
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onViewDetails={onViewDetails}
          />
        ))}
      </div>
    </div>
  );
};

export default ProductResults;
