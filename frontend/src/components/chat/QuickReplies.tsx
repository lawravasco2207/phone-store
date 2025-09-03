// QuickReplies component for providing suggestion chips
import React from 'react';
import { useChatStore } from '../../store/useChatStore';
import './styles/QuickReplies.css';

interface QuickRepliesProps {
  onSelect: (text: string) => void;
}

const QuickReplies: React.FC<QuickRepliesProps> = ({ onSelect }) => {
  const { prefs, products } = useChatStore();
  
  // Generate dynamic suggestions based on context
  const getSuggestions = () => {
    const suggestions = [];
    
    // Budget-related suggestions
    if (!prefs.budgetMax) {
      suggestions.push('Under $500');
      suggestions.push('Premium options');
    }
    
    // If we have products, suggest comparisons
    if (products && products.length >= 2) {
      suggestions.push('Compare these items');
    }
    
    // If we have products, suggest alternatives
    if (products && products.length > 0) {
      suggestions.push('Show alternatives');
    }
    
    // Generic suggestions
    suggestions.push('Best sellers');
    
    // Add category-specific suggestions
    if (prefs.category === 'laptop') {
      suggestions.push('16GB RAM');
      suggestions.push('Best battery life');
    } else if (prefs.category === 'phone') {
      suggestions.push('Best camera');
      suggestions.push('5G models');
    }
    
    return suggestions.slice(0, 5); // Limit to 5 suggestions
  };
  
  const suggestions = getSuggestions();
  
  return (
    <div className="quick-replies">
      {suggestions.map((suggestion, index) => (
        <button
          key={index}
          className="quick-reply-chip"
          onClick={() => onSelect(suggestion)}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};

export default QuickReplies;
