import React from 'react';

export interface ConversationHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  messages: Array<{
    id: string;
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
    toolCalls?: Array<any>;
  }>;
}

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
  const formatDate = (date: Date): string => {
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const isToday = date.toDateString() === today.toDateString();
    const isYesterday = date.toDateString() === yesterday.toDateString();
    
    if (isToday) {
      return `Today at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else if (isYesterday) {
      return `Yesterday at ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    } else {
      return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
  };

  return (
    <div className="conversation-history-panel">
      <div className="history-header">
        <h3>Conversation History</h3>
        <button onClick={onClose} className="close-button" aria-label="Close history">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="history-content">
        {history.length === 0 ? (
          <div className="no-history">
            No conversation history yet
          </div>
        ) : (
          history.map(convo => (
            <div 
              key={convo.id} 
              className={`history-item ${activeConversationId === convo.id ? 'active' : ''}`}
              onClick={() => onSelectConversation(convo)}
            >
              <div className="time">{formatDate(convo.timestamp)}</div>
              <div className="title">{convo.title}</div>
              <button 
                className="delete-history" 
                onClick={(e) => {
                  e.stopPropagation();
                  onDeleteConversation(convo.id);
                }}
                aria-label="Delete conversation"
              >
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
                </svg>
              </button>
            </div>
          ))
        )}
      </div>

      {history.length > 0 && (
        <button 
          className="clear-all-history" 
          onClick={onClearAllHistory}
        >
          Clear All History
        </button>
      )}
    </div>
  );
};

export default ConversationHistory;
