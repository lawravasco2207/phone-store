import type { ShoppingFlowState } from '../types/chatTypes';
import { isProductCategory, extractCategory } from './chatUtils.js';

// Functions for analyzing and updating state based on messages

// Analyze user message to detect shopping intent
function analyzeUserMessage(
  message: string,
  setShoppingFlowState: (state: ShoppingFlowState) => void,
  setLastCategory: (category: string) => void,
  shoppingFlowState: ShoppingFlowState
) {
  const lowerMessage = message.toLowerCase();
  
  // Check for greetings or general inquiries - reset state
  if (/^(hi|hello|hey|greetings|howdy|what can you do|help me)/i.test(lowerMessage)) {
    setShoppingFlowState('initial');
    return;
  }
  
  // Check for checkout intent
  if (/checkout|buy now|purchase|complete order|proceed to payment/i.test(lowerMessage)) {
    setShoppingFlowState('checkout');
    return;
  }
  
  // Check for cart intent
  if (/cart|shopping bag|my items|show cart|view cart/i.test(lowerMessage)) {
    setShoppingFlowState('cart');
    return;
  }
  
  // Check for category browsing intent
  if (isProductCategory(lowerMessage)) {
    setShoppingFlowState('browsing_products');
    const category = extractCategory(lowerMessage);
    if (category) {
      setLastCategory(category);
    }
    return;
  }
  
  // Check for comparison or recommendation requests
  if (/compare|vs|versus|difference between|recommend|suggestion|best|top rated/i.test(lowerMessage)) {
    // Keep browsing state, but note that we're looking for comparisons/recommendations
    if (shoppingFlowState !== 'browsing_products' && shoppingFlowState !== 'viewing_product') {
      setShoppingFlowState('browsing_products');
    }
    return;
  }
  
  // If user is asking about specific product features while in viewing_product state, maintain that state
  if (shoppingFlowState === 'viewing_product' && 
      /features|specs|specification|compare|details|description|color|size|price/i.test(lowerMessage)) {
    // Keep the current state
    return;
  }
  
  // If asking about store info or policies
  if (/store (hours|location)|shipping|delivery|return policy|warranty/i.test(lowerMessage)) {
    // This doesn't change the shopping state but could be handled by the AI response
    return;
  }
};

// Update state based on assistant message content
function updateStateFromAssistantMessage(
  message: string,
  setShoppingFlowState: (state: ShoppingFlowState) => void,
  setLastCategory: (category: string) => void,
  shoppingFlowState: ShoppingFlowState
) {
  const lowerMessage = message.toLowerCase();
  
  // If assistant is suggesting products or categories
  if (/would you like to see|i can show you|here are some|we have several/i.test(lowerMessage) &&
      isProductCategory(lowerMessage)) {
    setShoppingFlowState('browsing_products');
    const category = extractCategory(lowerMessage);
    if (category) {
      setLastCategory(category);
    }
  }
  
  // If assistant is describing a specific product
  if (/this product|this (smartphone|phone|laptop|device|item)|features include/i.test(lowerMessage) && 
      shoppingFlowState !== 'viewing_product') {
    setShoppingFlowState('viewing_product');
  }
  
  // If assistant is talking about cart
  if (/your cart|shopping cart|items in your cart|added to your cart/i.test(lowerMessage)) {
    setShoppingFlowState('cart');
  }
  
  // If assistant is talking about checkout
  if (/checkout process|payment options|shipping information|complete your purchase/i.test(lowerMessage)) {
    setShoppingFlowState('checkout');
  }
};

// Export both functions
export { analyzeUserMessage, updateStateFromAssistantMessage };
