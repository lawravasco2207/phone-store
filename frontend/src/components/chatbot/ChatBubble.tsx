import React from 'react';
import type { Product } from '../../utils/api';
import ProductResults from './ProductResults';

interface ChatBubbleProps {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: Date;
  products?: Product[];
  onAddToCart?: (productId: number) => void;
  onViewDetails?: (productId: number) => void;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ 
  sender, 
  text, 
  timestamp,
  products,
  onAddToCart = () => {}, 
  onViewDetails = () => {} 
}) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className="chat-message-container">
      <div className={`chat-bubble ${sender}`}>
        <span>{text}</span>
        {timestamp && (
          <span className="message-time">{formatTime(timestamp)}</span>
        )}
      </div>
      
      {/* Only render product results for bot messages and when products are available */}
      {sender === 'bot' && products && products.length > 0 && (
        <ProductResults 
          products={products} 
          onAddToCart={onAddToCart} 
          onViewDetails={onViewDetails} 
        />
      )}
    </div>
  );
};

export default ChatBubble;
