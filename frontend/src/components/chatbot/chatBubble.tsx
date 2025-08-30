import React from "react";
import './chatStyles.css';

interface ChatBubbleProps {
    sender: 'user' | 'bot';
    text: string;
    timestamp?: Date;
}

const ChatBubble: React.FC<ChatBubbleProps> = ({ sender, text, timestamp = new Date() }) => {
    // For typing indicator
    if (text === '...') {
        return (
            <div className={`chat-bubble ${sender} typing`}>
                <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                </div>
            </div>
        );
    }

    // Format the timestamp
    const formatTime = (date: Date): string => {
        return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    };

    // Process links in text
    const processText = (text: string): React.ReactNode => {
        // Simple URL regex
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        
        // Split by URLs
        const parts = text.split(urlRegex);
        
        // Find all URLs
        const urls = text.match(urlRegex) || [];
        
        // Create result array with text and links
        const result: React.ReactNode[] = [];
        
        parts.forEach((part, i) => {
            // Add the text part
            result.push(<span key={`text-${i}`}>{part}</span>);
            
            // Add URL if there is one for this position
            if (urls[i]) {
                result.push(
                    <a 
                        key={`link-${i}`} 
                        href={urls[i]} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        style={{ 
                            color: sender === 'user' ? 'white' : '#3b82f6',
                            textDecoration: 'underline'
                        }}
                    >
                        {urls[i]}
                    </a>
                );
            }
        });
        
        return <>{result}</>;
    };

    return (
        <div className={`chat-bubble ${sender}`}>
            {processText(text)}
            <span className="message-time">{formatTime(timestamp)}</span>
        </div>
    );
};

export default ChatBubble;