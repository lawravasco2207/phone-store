import React from 'react';
import type { ConversationHistoryItem } from '../types/chatTypes';

interface ConversationHistoryProps {
  history: ConversationHistoryItem[];
  activeConversationId: string | null;
  onSelectConversation: (conversation: ConversationHistoryItem) => void;
  onDeleteConversation: (id: string) => void;
  onClearAllHistory: () => void;
  onClose: () => void;
}

const ConversationHistory: React.FC<ConversationHistoryProps> = ({
  history,
  activeConversationId,
  onSelectConversation,
  onDeleteConversation,
  onClearAllHistory,
  onClose
}) => {
  const formatDate = (date: Date) => {
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isYesterday) {
      return `Yesterday, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  };
  
  return (
    <div className="conversation-history-panel">
      <div className="history-header">
        <h3>Conversation History</h3>
        <button onClick={onClose} className="close-button">×</button>
      </div>
      
      <div className="history-content">
        {history.length === 0 ? (
          <div className="no-history">
            <p>No saved conversations yet.</p>
          </div>
        ) : (
          <ul className="conversation-list">
            {history.map((conversation) => (
              <li 
                key={conversation.id}
                className={`conversation-item ${activeConversationId === conversation.id ? 'active' : ''}`}
              >
                <button
                  onClick={() => onSelectConversation(conversation)}
                  className="conversation-select-button"
                >
                  <span className="conversation-title">{conversation.title}</span>
                  <span className="conversation-date">{formatDate(conversation.timestamp)}</span>
                </button>
                <button
                  onClick={() => onDeleteConversation(conversation.id)}
                  className="conversation-delete-button"
                  title="Delete conversation"
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
      
      <div className="history-footer">
        {history.length > 0 && (
          <button 
            onClick={onClearAllHistory}
            className="clear-history-button"
          >
            Clear All History
          </button>
        )}
        <button onClick={onClose} className="close-history-button">Close</button>
      </div>
    </div>
  );
};

export default ConversationHistory;
