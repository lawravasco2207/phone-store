import React from 'react';
import type { Product } from '../../utils/api';
import { API_BASE_URL } from '../../utils/api';

interface ProductCardProps {
  product: Product;
  onAddToCart: (productId: number) => void;
  onViewDetails: (productId: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onAddToCart, onViewDetails }) => {
  // Format the price to 2 decimal places
  const formattedPrice = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(typeof product.price === 'number' ? product.price : 0);

  // Get the primary image or use a placeholder
  const primaryImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : `${API_BASE_URL}/placeholder/400/400`;

  return (
    <div className="product-card">
      <div className="product-image">
        <img src={primaryImage} alt={product.name} />
      </div>
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{formattedPrice}</p>
        <span className="text-gray-400">No ratings</span>
        <p className="product-description">
          {product.description 
            ? (product.description.length > 120 ? product.description.substring(0, 120) + '...' : product.description)
            : 'No description available'}
        </p>
        <div className="product-actions">
          <button 
            onClick={() => onAddToCart(product.id)}
            className="add-to-cart-btn"
            aria-label={`Add ${product.name} to cart`}
          >
            Add to Cart
          </button>
          <button 
            onClick={() => onViewDetails(product.id)}
            className="view-details-btn"
            aria-label={`View details for ${product.name}`}
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
