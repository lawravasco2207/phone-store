import React from 'react';

interface ChatBubbleProps {
  sender: 'user' | 'bot';
  text: string;
  timestamp?: Date;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ sender, text, timestamp }) => {
  const formatTime = (date: Date) => {
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <div className={`chat-bubble ${sender}`}>
      <span>{text}</span>
      {timestamp && (
        <span className="message-time">{formatTime(timestamp)}</span>
      )}
    </div>
  );
};

export default ChatBubble;
