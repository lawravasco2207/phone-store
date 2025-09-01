import React, { useState, useEffect } from 'react';
import { api } from '../../utils/api.js';
import type { Product, CartItem } from '../../utils/api.js';
import { useCart } from '../CartContext.js';
import type { PanelView, ShoppingFlowState } from './types/chatTypes';

interface ShoppingPanelProps {
  view: PanelView;
  searchQuery?: string;
  productId?: string | null;
  onCheckoutComplete: () => void;
  shoppingFlowState?: ShoppingFlowState;
  lastCategory?: string;
}

const ShoppingPanel: React.FC<ShoppingPanelProps> = ({ 
  view, 
  searchQuery = '',
  productId = null,
  onCheckoutComplete,
  shoppingFlowState = 'initial',
  lastCategory = ''
}) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { items, addToCart, removeFromCart } = useCart();
  
  // Helper function to get a human-readable shopping state
  const getShoppingStateText = (state: ShoppingFlowState): string => {
    switch (state) {
      case 'initial':
        return 'Ready to help';
      case 'browsing_products':
        return lastCategory ? `Browsing ${lastCategory}` : 'Browsing products';
      case 'viewing_product':
        return 'Viewing product details';
      case 'cart':
        return 'Viewing cart';
      case 'checkout':
        return 'Checkout';
      default:
        return '';
    }
  };
  
  // Render shopping flow state indicator
  const renderShoppingStateIndicator = () => {
    const stateText = getShoppingStateText(shoppingFlowState);
    if (!stateText) return null;
    
    return (
      <div className="text-xs bg-gray-100 text-gray-600 rounded-full px-3 py-1 inline-block mb-2">
        {stateText}
      </div>
    );
  };
  
  // Fetch products based on search query
  useEffect(() => {
    if (view !== 'products' || !searchQuery) return;
    
    const fetchProducts = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.getProducts({ 
          search: searchQuery,
          limit: 10 
        });
        
        if (response.success && response.data?.products) {
          setProducts(response.data.products);
        } else {
          setError('Failed to load products');
        }
      } catch (err) {
        console.error('Error fetching products:', err);
        setError('An error occurred while fetching products');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProducts();
  }, [view, searchQuery]);
  
  // Fetch single product
  useEffect(() => {
    if (view !== 'product-detail' || !productId) return;
    
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const response = await api.getProduct(parseInt(productId));
        
        if (response.success && response.data?.product) {
          setProduct(response.data.product);
        } else {
          setError('Failed to load product details');
        }
      } catch (err) {
        console.error('Error fetching product:', err);
        setError('An error occurred while fetching product details');
      } finally {
        setLoading(false);
      }
    };
    
    fetchProduct();
  }, [view, productId]);
  
  // Handle checkout completion
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      // Listen for messages from checkout iframe
      if (event.data?.type === 'CHECKOUT_COMPLETE') {
        onCheckoutComplete();
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [onCheckoutComplete]);
  
  // Render products list
  const renderProductsList = () => {
    if (loading) {
      return <div className="loading-spinner">Loading products...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (products.length === 0) {
      return (
        <div className="empty-state">
          <p>No products found{searchQuery ? ` for "${searchQuery}"` : ''}.</p>
        </div>
      );
    }
    
    return (
      <div className="products-grid">
        {products.map(product => (
          <div key={product.id} className="product-card">
            {product.images && product.images[0] && (
              <img 
                src={product.images[0]} 
                alt={product.name} 
                className="product-image" 
              />
            )}
            <h3 className="product-name">{product.name}</h3>
            <p className="product-price">${product.price.toFixed(2)}</p>
            <button 
              className="add-to-cart-btn"
              onClick={() => addToCart(product.id, 1)}
            >
              Add to Cart
            </button>
          </div>
        ))}
      </div>
    );
  };
  
  // Render product details
  const renderProductDetail = () => {
    if (loading) {
      return <div className="loading-spinner">Loading product details...</div>;
    }
    
    if (error) {
      return <div className="error-message">{error}</div>;
    }
    
    if (!product) {
      return (
        <div className="empty-state">
          <p>Product not found.</p>
        </div>
      );
    }
    
    return (
      <div className="product-detail">
        <div className="product-images">
          {product.images && product.images.length > 0 ? (
            <img 
              src={product.images[0]} 
              alt={product.name} 
              className="main-product-image" 
            />
          ) : (
            <div className="no-image">No image available</div>
          )}
          
          {product.images && product.images.length > 1 && (
            <div className="thumbnail-images">
              {product.images.slice(1, 4).map((image, index) => (
                <img 
                  key={index} 
                  src={image} 
                  alt={`${product.name} - view ${index + 2}`} 
                  className="thumbnail-image" 
                />
              ))}
            </div>
          )}
        </div>
        
        <div className="product-info">
          <h2 className="product-title">{product.name}</h2>
          <p className="product-category">
            {product.Categories?.[0]?.name || product.category}
          </p>
          <p className="product-price">${product.price.toFixed(2)}</p>
          
          <div className="product-description">
            {product.description || 'No description available.'}
          </div>
          
          <div className="product-stock">
            {(product.inventory || product.Inventory?.stock_quantity) ? 
              'In Stock' : 'Out of Stock'}
          </div>
          
          <button 
            className="add-to-cart-btn full-width"
            onClick={() => addToCart(product.id, 1)}
            disabled={!(product.inventory || product.Inventory?.stock_quantity)}
          >
            Add to Cart
          </button>
        </div>
      </div>
    );
  };
  
  // Render cart
  const renderCart = () => {
    if (!items || items.length === 0) {
      return (
        <div className="empty-state">
          <p>Your cart is empty.</p>
        </div>
      );
    }
    
    const total = items.reduce((sum: number, item: CartItem) => 
      sum + (item.Product.price * item.quantity), 0);
      
    return (
      <div className="cart-content">
        <h2 className="cart-title">Your Cart</h2>
        
        <div className="cart-items">
          {items.map((item: CartItem) => (
            <div key={item.id} className="cart-item">
              {item.Product.images && item.Product.images[0] && (
                <img 
                  src={item.Product.images[0]} 
                  alt={item.Product.name} 
                  className="cart-item-image" 
                />
              )}
              
              <div className="cart-item-details">
                <h3 className="cart-item-name">{item.Product.name}</h3>
                <p className="cart-item-price">${item.Product.price.toFixed(2)}</p>
                
                <div className="cart-item-quantity">
                  <button 
                    onClick={() => removeFromCart(item.id)}
                    className="quantity-btn"
                  >
                    -
                  </button>
                  <span>{item.quantity}</span>
                  <button 
                    onClick={() => addToCart(item.Product.id, 1)}
                    className="quantity-btn"
                  >
                    +
                  </button>
                </div>
              </div>
              
              <button 
                className="remove-item-btn"
                onClick={() => removeFromCart(item.id)}
                aria-label="Remove item"
              >
                ×
              </button>
            </div>
          ))}
        </div>
        
        <div className="cart-summary">
          <div className="cart-total">
            <span>Total:</span>
            <span>${total.toFixed(2)}</span>
          </div>
          
          <button 
            className="checkout-btn"
            onClick={() => api.initiateCheckout()}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    );
  };
  
  // Render checkout
  const renderCheckout = () => {
    return (
      <div className="checkout-container">
        <div className="secure-checkout-banner">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="lock-icon">
            <path strokeLinecap="round" strokeLinejoin="round" d="M16.5 10.5V6.75a4.5 4.5 0 10-9 0v3.75m-.75 11.25h10.5a2.25 2.25 0 002.25-2.25v-6.75a2.25 2.25 0 00-2.25-2.25H6.75a2.25 2.25 0 00-2.25 2.25v6.75a2.25 2.25 0 002.25 2.25z" />
          </svg>
          <span>Secure Checkout</span>
        </div>
        
        <iframe 
          src="/checkout"
          title="Secure Checkout"
          className="checkout-iframe"
          sandbox="allow-same-origin allow-scripts allow-forms"
        />
      </div>
    );
  };
  
  // Render the appropriate view
  const renderContent = () => {
    switch (view) {
      case 'products':
        return renderProductsList();
      case 'product-detail':
        return renderProductDetail();
      case 'cart':
        return renderCart();
      case 'checkout':
        return renderCheckout();
      default:
        return <div>Select a product or ask the assistant for help.</div>;
    }
  };
  
  return (
    <div className="shopping-panel-content">
      <div className="panel-header">
        {view === 'products' && (searchQuery ? 
          `Search Results: ${searchQuery}` : 'Products')}
        {view === 'product-detail' && 'Product Details'}
        {view === 'cart' && 'Your Cart'}
        {view === 'checkout' && 'Secure Checkout'}
        {renderShoppingStateIndicator()}
      </div>
      
      <div className="panel-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default ShoppingPanel;
