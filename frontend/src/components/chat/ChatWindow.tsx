// Main chat window component
import React, { useState, useRef, useEffect } from 'react';
import { useChatStore } from '../../store/useChatStore';
// Import from the index file
import { MessageList, TypingIndicator, QuickReplies } from '.';
import './styles/ChatWindow.css';
import { connectSocket, disconnectSocket } from '../../utils/socket';

const ChatWindow: React.FC = () => {
  const { 
    messages, 
    sendMessage, 
    isLoading, 
    sessionId,
    isOpen,
    toggleChat
  } = useChatStore();
  
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };
  
  // Focus input when chat opens
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      
      // Connect to Socket.IO
      connectSocket(sessionId);
      console.log('🌐 ChatWindow: Connected to socket with session ID:', sessionId);
    } else {
      // Disconnect from Socket.IO when chat is closed
      disconnectSocket();
      console.log('🌐 ChatWindow: Disconnected from socket');
    }
    
    // Cleanup on unmount
    return () => {
      disconnectSocket();
    };
  }, [isOpen, sessionId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    console.log('🌐 ChatWindow: Messages changed, scrolling to bottom', messages.length);
    scrollToBottom();
  }, [messages]);
  
  // Handle sending message
  const handleSendMessage = () => {
    if (input.trim() && !isLoading) {
      sendMessage(input);
      setInput('');
    }
  };
  
  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };
  
  // Handle quick reply selection
  const handleQuickReply = (text: string) => {
    sendMessage(text);
  };
  
  // If chat is not open, show only the toggle button
  if (!isOpen) {
    return (
      <button 
        className="chat-toggle-button"
        onClick={toggleChat}
        aria-label="Open AI Sales Assistant"
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="chat-icon">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.935-.532-1.211a9.75 9.75 0 01-4.382-8.2c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
        </svg>
      </button>
    );
  }
  
  return (
    <div className="chat-window-container">
      <div className="chat-header">
        <h2>AI Sales Assistant</h2>
        <button 
          className="close-button"
          onClick={toggleChat}
          aria-label="Close chat"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      
      <div className="chat-messages-container">
        {messages.length === 0 ? (
          <div className="welcome-message">
            <h3>Welcome to our AI Sales Assistant</h3>
            <p>Ask me about products, specs, or recommendations. I'm here to help you find the perfect item!</p>
          </div>
        ) : (
          <MessageList />
        )}
        
        {isLoading && <TypingIndicator />}
        
        <div ref={messagesEndRef} />
      </div>
      
      <QuickReplies onSelect={handleQuickReply} />
      
      <div className="chat-input-container">
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask about products..."
          disabled={isLoading}
          aria-label="Chat message input"
        />
        <button
          onClick={handleSendMessage}
          disabled={!input.trim() || isLoading}
          aria-label="Send message"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
          </svg>
        </button>
      </div>
    </div>
  );
};

export default ChatWindow;
