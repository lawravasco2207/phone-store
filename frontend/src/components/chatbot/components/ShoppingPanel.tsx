import React from 'react';
import type { PanelView, ShoppingFlowState } from '../types/chatTypes';

interface ShoppingPanelProps {
  view: PanelView;
  searchQuery: string;
  productId: string | null;
  shoppingFlowState: ShoppingFlowState;
  lastCategory: string;
  onCheckoutComplete: () => void;
}

const ShoppingPanel: React.FC<ShoppingPanelProps> = ({
  view,
  searchQuery,
  productId,
  shoppingFlowState,
  lastCategory,
  onCheckoutComplete
}) => {
  // This is a simplified version - in a real implementation you would
  // have actual product data and UI for browsing/displaying products
  
  const renderContent = () => {
    switch (view) {
      case 'products':
        return (
          <div className="products-view">
            <h3>Products</h3>
            {searchQuery && (
              <div className="search-results">
                <p>Showing results for: <strong>{searchQuery}</strong></p>
                {lastCategory && <p>Category: {lastCategory}</p>}
                {/* Product list would go here */}
                <div className="product-list-placeholder">
                  <p>Product list would be displayed here</p>
                </div>
              </div>
            )}
          </div>
        );
        
      case 'product-detail':
        return (
          <div className="product-detail-view">
            <h3>Product Details</h3>
            {productId ? (
              <div className="product-detail">
                <p>Viewing product: <strong>{productId}</strong></p>
                {/* Product details would go here */}
                <div className="product-detail-placeholder">
                  <p>Product details would be displayed here</p>
                </div>
              </div>
            ) : (
              <p>No product selected</p>
            )}
          </div>
        );
        
      case 'cart':
        return (
          <div className="cart-view">
            <h3>Shopping Cart</h3>
            {/* Cart items would go here */}
            <div className="cart-placeholder">
              <p>Cart items would be displayed here</p>
            </div>
          </div>
        );
        
      case 'checkout':
        return (
          <div className="checkout-view">
            <h3>Checkout</h3>
            {/* Checkout form would go here */}
            <div className="checkout-placeholder">
              <p>Checkout form would be displayed here</p>
            </div>
            <button 
              onClick={onCheckoutComplete}
              className="complete-checkout-button"
            >
              Complete Checkout
            </button>
          </div>
        );
        
      default:
        return <p>Select a product to view details</p>;
    }
  };
  
  return (
    <div className="shopping-panel-container">
      <div className="shopping-panel-header">
        <h2>E-com Store</h2>
        <div className="shopping-flow-indicator">
          Current step: {shoppingFlowState.replace('_', ' ')}
        </div>
      </div>
      
      <div className="shopping-panel-content">
        {renderContent()}
      </div>
    </div>
  );
};

export default ShoppingPanel;
