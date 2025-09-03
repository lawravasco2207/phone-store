// Message list component to display chat messages and product cards
import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import type { Message, Product } from '../../store/useChatStore';
// Import ProductCard from the index file
import { ProductCard } from '.';
import './styles/MessageList.css';

const MessageList: React.FC = () => {
  const { messages, products } = useChatStore();
  
  // Debug - log messages and products
  React.useEffect(() => {
    console.log('📋 MessageList: Current messages:', messages);
    console.log('📋 MessageList: Current products:', products);
  }, [messages, products]);
  
  // Format timestamp
  const formatTime = (date: Date) => {
    return new Date(date).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit'
    });
  };
  
  return (
    <div className="message-list">
      {messages.map((message: Message) => (
        <div 
          key={message.id} 
          className={`message ${message.role === 'user' ? 'user' : 'assistant'}`}
        >
          <div className="message-content">{message.content}</div>
          <div className="message-timestamp">{formatTime(message.timestamp)}</div>
        </div>
      ))}
      
      {/* Render product cards if available */}
      {products && products.length > 0 && (
        <div className="product-cards-container">
          {products.map((product: Product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
};

export default MessageList;
