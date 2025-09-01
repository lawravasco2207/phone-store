import { useState, useEffect } from 'react';
import type { ShoppingFlowState, PanelView, ToolCall } from '../types/chatTypes';

interface UseShoppingProps {
  useCart: any; // Replace with proper type from your actual cart implementation
}

interface ShoppingState {
  panelView: PanelView;
  searchQuery: string;
  selectedProductId: string | null;
  shoppingFlowState: ShoppingFlowState;
  lastCategory: string;
  lastSearchQuery: string;
  isCheckoutMode: boolean;
  setPanelView: (view: PanelView) => void;
  setSearchQuery: (query: string) => void;
  setSelectedProductId: (id: string | null) => void;
  setShoppingFlowState: (state: ShoppingFlowState) => void;
  setLastCategory: (category: string) => void;
  setLastSearchQuery: (query: string) => void;
  handleToolCalls: (toolCalls: ToolCall[]) => Promise<void>;
  exitCheckoutMode: () => void;
  suggestRelatedItems: (category: string) => void;
}

export const useShopping = ({ useCart }: UseShoppingProps): ShoppingState => {
  // Shopping panel state
  const [panelView, setPanelView] = useState<PanelView>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [shoppingFlowState, setShoppingFlowState] = useState<ShoppingFlowState>('initial');
  const [lastCategory, setLastCategory] = useState<string>('');
  const [lastSearchQuery, setLastSearchQuery] = useState<string>('');
  const [isCheckoutMode, setIsCheckoutMode] = useState(false);
  
  const { addToCart, removeFromCart } = useCart();

  // Update shopping flow state when panel view changes
  useEffect(() => {
    if (panelView === 'products') {
      setShoppingFlowState('browsing_products');
    } else if (panelView === 'product-detail') {
      setShoppingFlowState('viewing_product');
    } else if (panelView === 'cart') {
      setShoppingFlowState('cart');
    } else if (panelView === 'checkout') {
      setShoppingFlowState('checkout');
    }
  }, [panelView]);

  // Handle tool calls received from the backend
  const handleToolCalls = async (toolCalls: ToolCall[]) => {
    for (const toolCall of toolCalls) {
      const { name } = toolCall.function || {} as any;
      // Ensure arguments is a parsed object
      let args: any = toolCall.function?.arguments ?? {};
      if (typeof args === 'string') {
        try {
          args = JSON.parse(args);
        } catch {
          args = {};
        }
      }
      
      switch (name) {
        case 'searchProducts': {
          const search = (args.query ?? args.category ?? '').toString();
          setSearchQuery(search);
          setPanelView('products');
          
          // Update shopping flow state
          if (isProductCategory(args.category ?? args.query)) {
            setShoppingFlowState('browsing_products');
            if (args.category) setLastCategory(String(args.category));
            else if (args.query) setLastCategory(String(args.query));
          } else if (search) {
            setShoppingFlowState('browsing_products');
            setLastSearchQuery(search);
          }
          break;
        }
          
        case 'showProduct':
          setSelectedProductId(args.id ? String(args.id) : null);
          setPanelView('product-detail');
          setShoppingFlowState('viewing_product');
          
          // Consider suggesting related items or accessories after showing a product
          if (args.id && args.category) {
            suggestRelatedItems(args.category);
          }
          break;
          
        case 'addToCart':
          try {
            if (args.id) {
              addToCart(args.id, args.quantity || 1);
              // After successfully adding to cart, could suggest complementary items
              if (args.category) {
                suggestComplementaryItems(args.category);
              }
            }
          } catch (error) {
            console.error('Error adding to cart:', error);
          }
          break;
          
        case 'removeFromCart':
          try {
            if (args.id) {
              removeFromCart(args.id, args.quantity || 1);
            }
          } catch (error) {
            console.error('Error removing from cart:', error);
          }
          break;
          
        case 'openCheckout':
          setPanelView('checkout');
          setIsCheckoutMode(true);
          setShoppingFlowState('checkout');
          break;
          
        default:
          console.warn(`Unknown tool call: ${name}`);
      }
    }
  };
  
  // Suggest related items based on the current product
  const suggestRelatedItems = (category: string) => {
    // Implementation would go here - connect to actual component methods
    console.log(`Suggesting related items for category: ${category}`);
  };
  
  // Suggest complementary items after adding something to cart
  const suggestComplementaryItems = (category: string) => {
    // Implementation would go here - connect to actual component methods  
    console.log(`Suggesting complementary items for category: ${category}`);
  };
  
  const exitCheckoutMode = () => {
    setIsCheckoutMode(false);
    setPanelView('products');
  };

  // Helper function to check if a query is likely a product category
  const isProductCategory = (query: string): boolean => {
    if (!query || typeof query !== 'string') return false;
    const categories = [
      'phones', 'phone', 'smartphone', 'smartphones',
      'laptops', 'laptop', 'computer', 'computers',
      'accessories', 'accessory',
      'furniture', 'chair', 'table', 'desk', 'sofa', 'couch',
      'shoes', 'shoe', 'sneakers', 'boots', 'sandals',
      'clothes', 'clothing', 'shirt', 't-shirt', 'pants', 'dress', 'jacket'
    ];
    
    return categories.some(category => 
      query.toLowerCase().includes(category.toLowerCase())
    );
  };

  return {
    panelView,
    searchQuery,
    selectedProductId,
    shoppingFlowState,
    lastCategory,
    lastSearchQuery,
    isCheckoutMode,
    setPanelView,
    setSearchQuery,
    setSelectedProductId,
    setShoppingFlowState,
    setLastCategory,
    setLastSearchQuery,
    handleToolCalls,
    exitCheckoutMode,
    suggestRelatedItems
  };
};
