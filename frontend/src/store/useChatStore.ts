// Chat store using Zustand for state management
import { create } from 'zustand';
import { v4 as uuidv4 } from 'uuid';
import { api } from '../utils/api';
// import { socket } from '../utils/socket'; // Removed due to missing module
import type { Product as ApiProduct } from '../utils/api';

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
}

// Our internal Product type for the chat
export interface Product {
  id: number;
  name: string;
  price: number;
  description: string;
  images: string[];
  inStock: boolean;
  stockQuantity: number;
  categories: string[];
  reason?: string;
}

// Helper to convert API product to our internal format
const convertApiProductToInternal = (apiProduct: ApiProduct): Product => {
  if (!apiProduct) {
    console.warn('Attempted to convert undefined or null API product');
    return {
      id: 0,
      name: 'Product Unavailable',
      price: 0,
      description: '',
      images: [],
      inStock: false,
      stockQuantity: 0,
      categories: [],
    };
  }

  return {
    id: apiProduct.id || 0,
    name: apiProduct.name || 'Unnamed Product',
    price: Number(apiProduct.price) || 0,
    description: apiProduct.description || '',
    images: Array.isArray(apiProduct.images) ? apiProduct.images : [],
    // Handle inventory information
    inStock: apiProduct.Inventory ? apiProduct.Inventory.stock_quantity > 0 : (typeof (apiProduct as any).inventory === 'number' ? (apiProduct as any).inventory > 0 : false),
    stockQuantity: apiProduct.Inventory ? apiProduct.Inventory.stock_quantity : ((apiProduct as any).inventory || 0),
    // Handle categories
    categories: Array.isArray(apiProduct.Categories) 
      ? apiProduct.Categories.map(c => c.name) 
      : (Array.isArray((apiProduct as any).categories) ? (apiProduct as any).categories : []),
    // Add additional fields from AI assistant
    reason: (apiProduct as any).reason || ''
  };
};

export interface ChatPreferences {
  budgetMax?: number;
  preferredBrand?: string;
  category?: string;
  color?: string;
  size?: string;
  [key: string]: any;
}

export interface ChatStoreState {
  messages: Message[];
  isLoading: boolean;
  sessionId: string;
  products: Product[];
  actions: string[];
  prefs: ChatPreferences;
  isOpen: boolean;
  // socket: any; // Removed due to missing module
  
  // Actions
  sendMessage: (text: string) => Promise<void>;
  appendBotMessage: (text: string) => void;
  setProducts: (products: Product[]) => void;
  setActions: (actions: string[]) => void;
  updatePrefs: (newPrefs: ChatPreferences) => void;
  toggleChat: () => void;
  clearMessages: () => void;
}

// Helper to retrieve or create a session ID from localStorage
const getSessionId = (): string => {
  const storedId = localStorage.getItem('chat_session_id');
  if (storedId) return storedId;
  
  const newId = uuidv4();
  localStorage.setItem('chat_session_id', newId);
  return newId;
};

export const useChatStore = create<ChatStoreState>((set, get) => ({
  messages: [],
  isLoading: false,
  sessionId: getSessionId(),
  products: [],
  actions: [],
  prefs: {},
  isOpen: false,
  socket: null,
  
  sendMessage: async (text: string) => {
    if (!text.trim()) return;
    
    // Create user message
    const userMessage: Message = {
      id: uuidv4(),
      role: 'user',
      content: text,
      timestamp: new Date()
    };
    
    // Optimistically add to messages
    set(state => ({
      messages: [...state.messages, userMessage],
      isLoading: true
    }));
    
    try {
      const { sessionId, prefs } = get();
      
      console.log('💬 Chat: Sending message via API:', { text, sessionId });
      
      // Send to backend
      const response = await api.assistantSend(text, sessionId, { prefs });
      
      console.log('💬 Chat: Received API response:', response);
      
      // Check if response is success - handle different response formats 
      if (response.success) {
        // Get the content from wherever it's available in the response
        const responseData = response.data || response as any;
        
        // Add bot message
        const assistantMessage: Message = {
          id: uuidv4(),
          role: 'assistant',
          content: responseData.assistant_message || "I'm ready to help you find what you need!",
          timestamp: new Date()
        };
        
        console.log('💬 Chat: Creating assistant message:', assistantMessage);
        
        // Get suggested products from the response
        const suggestedProducts = responseData.suggested_products || [];
        
        // Transform API products to our internal product type - ensure we handle empty arrays properly
        const transformedProducts = Array.isArray(suggestedProducts) 
          ? suggestedProducts.map(apiProduct => 
              convertApiProductToInternal(apiProduct as ApiProduct)
            ) 
          : [];
        
        console.log('💬 Chat: Transformed products:', transformedProducts);
        
        // Get actions from the response
        const actions = responseData.actions || [];
        
        set(state => ({
          messages: [...state.messages, assistantMessage],
          products: transformedProducts,
          actions: actions,
          isLoading: false
        }));
        
        console.log('💬 Chat: State updated with new message and products');
      } else {
        console.warn('💬 Chat: Unsuccessful API response:', response);
        // Handle error
        set(state => ({
          messages: [
            ...state.messages, 
            {
              id: uuidv4(),
              role: 'assistant',
              content: "I'm sorry, I encountered an error. Please try again.",
              timestamp: new Date()
            }
          ],
          isLoading: false
        }));
      }
    } catch (error) {
      console.error('Error sending message:', error);
      
      // Add error message
      set(state => ({
        messages: [
          ...state.messages,
          {
            id: uuidv4(),
            role: 'assistant',
            content: "I'm having trouble connecting. Please try again in a moment.",
            timestamp: new Date()
          }
        ],
        isLoading: false
      }));
    }
  },
  
  appendBotMessage: (text: string) => {
    const message: Message = {
      id: uuidv4(),
      role: 'assistant',
      content: text,
      timestamp: new Date()
    };
    
    set(state => ({
      messages: [...state.messages, message]
    }));
  },
  
  setProducts: (products: Product[]) => {
    set({ products });
  },
  
  setActions: (actions: string[]) => {
    set({ actions });
  },
  
  updatePrefs: (newPrefs: ChatPreferences) => {
    set(state => ({
      prefs: { ...state.prefs, ...newPrefs }
    }));
  },
  
  toggleChat: () => {
    set(state => {
      const newIsOpen = !state.isOpen;
      // Socket connection removed due to missing module
      return { isOpen: newIsOpen };
    });
  },
  
  clearMessages: () => {
    set({ messages: [], products: [], actions: [] });
  }
}));
