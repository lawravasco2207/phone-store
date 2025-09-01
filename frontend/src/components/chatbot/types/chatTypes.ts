// Types for the Voice Chat Bot

// Message types
export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp?: Date;
  toolCalls?: ToolCall[];
  products?: Array<{
    id: number;
    name: string;
    price: number;
    description?: string;
    images?: string[];
  }>;
}

// Legacy interface for compatibility with existing code
export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
}

export interface ToolCall {
  id: string;
  type: string;
  function: {
    name: string;
    arguments: Record<string, any>;
  };
}

// Conversation history item
export interface ConversationHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  messages: ChatMessage[];
}

// Panel view states
export type PanelView = 'products' | 'product-detail' | 'cart' | 'checkout';

// Shopping flow states to track user's journey
export type ShoppingFlowState = 'initial' | 'browsing_categories' | 'browsing_products' | 'viewing_product' | 'cart' | 'checkout';

// Settings for the voice chatbot
export interface VoiceSettings {
  rate: number;
  pitch: number;
  volume: number;
  continuousMode: boolean;
}
