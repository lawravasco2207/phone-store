// TypingIndicator component to show when the AI is "typing"
import React from 'react';
import './styles/TypingIndicator.css';

const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator">
      <span></span>
      <span></span>
      <span></span>
    </div>
  );
};

export default TypingIndicator;
