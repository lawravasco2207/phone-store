// ProductCard component for displaying product information in the chat
import React from 'react';
import { useCart } from '../../components/CartContext';
import { useNavigate } from 'react-router-dom';
import type { Product } from '../../store/useChatStore';
import './styles/ProductCard.css';

interface ProductCardProps {
  product: Product;
}

const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { addToCart } = useCart();
  const navigate = useNavigate();
  
  // Format price
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(price);
  };
  
  // Get primary image or placeholder
  const primaryImage = product.images && product.images.length > 0 
    ? product.images[0] 
    : '/api/placeholder/400/400';
  
  // Handle adding product to cart
  const handleAddToCart = () => {
    addToCart(product.id, 1);
  };
  
  // Handle Buy Now button
  const handleBuyNow = () => {
    addToCart(product.id, 1);
    navigate('/checkout');
  };
  
  // Handle View Details button
  const handleViewDetails = () => {
    navigate(`/products/${product.id}`);
  };
  
  // Stock badge text
  const stockBadge = product.stockQuantity <= 5 && product.stockQuantity > 0
    ? `Only ${product.stockQuantity} left!`
    : product.inStock
      ? 'In Stock'
      : 'Out of Stock';
  
  // Stock badge class
  const stockBadgeClass = product.stockQuantity <= 5 && product.stockQuantity > 0
    ? 'stock-badge urgency'
    : product.inStock
      ? 'stock-badge in-stock'
      : 'stock-badge out-of-stock';
  
  return (
    <div className="product-card">
      <div className="product-image">
        <img src={primaryImage} alt={product.name} />
        <div className={stockBadgeClass}>{stockBadge}</div>
      </div>
      
      <div className="product-info">
        <h3 className="product-name">{product.name}</h3>
        <p className="product-price">{formatPrice(product.price)}</p>
        
        {/* Display categories if available */}
        {product.categories && product.categories.length > 0 && (
          <div className="product-categories">
            {product.categories.map((category, index) => (
              <span key={index} className="category-tag">{category}</span>
            ))}
          </div>
        )}
        
        {/* Display reason if available */}
        {product.reason && (
          <p className="product-reason">{product.reason}</p>
        )}
        
        <div className="product-description">
          {product.description.length > 100
            ? `${product.description.substring(0, 100)}...`
            : product.description}
        </div>
        
        <div className="product-actions">
          <button 
            className="add-to-cart-btn"
            onClick={handleAddToCart}
            disabled={!product.inStock}
          >
            Add to Cart
          </button>
          
          <button 
            className="buy-now-btn"
            onClick={handleBuyNow}
            disabled={!product.inStock}
          >
            Buy Now
          </button>
          
          <button 
            className="view-details-btn"
            onClick={handleViewDetails}
          >
            Details
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
