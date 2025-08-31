import React, { useState, useRef, useEffect } from "react";
import ChatBubble from "./ChatBubble.js";
import ShoppingPanel from "./ShoppingPanel.js";
import VoiceSettingsPanel from "./VoiceSettingsPanel.js";
import ConversationHistory from "./ConversationHistory.js";
import type { ConversationHistoryItem } from "./ConversationHistory.js";
import { useCart } from "../CartContext.js";
import { VoiceVisualizer, getVisualizerData } from "../../utils/voiceVisualizer.js";
import { api } from "../../utils/api.js";
import './chatStyles.css';
import './voiceChatStyles.css';
import './voiceEnhancements.css';

// Use type definitions from web-speech-api.d.ts
declare global {
  interface Window {
    SpeechRecognition: typeof SpeechRecognition;
    webkitSpeechRecognition: typeof SpeechRecognition;
  }
}

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp?: Date;
    toolCalls?: ToolCall[];
}

// Legacy interface for compatibility with existing code
// Used for conversion between APIs
export interface ChatMessage {
    id: string;
    sender: 'user' | 'bot';
    text: string;
    timestamp: Date;
}

interface ToolCall {
    id: string;
    type: string;
    function: {
        name: string;
        arguments: Record<string, any>;
    };
}

// Panel view states
export type PanelView = 'products' | 'product-detail' | 'cart' | 'checkout';

// Shopping flow states to track user's journey
export type ShoppingFlowState = 'initial' | 'browsing_categories' | 'browsing_products' | 'viewing_product' | 'cart' | 'checkout';

// Local storage keys
const HISTORY_STORAGE_KEY = 'voice-chat-history';
const VOICE_SETTINGS_KEY = 'voice-chat-settings';

const VoiceChatBot: React.FC = () => {
    // State
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    
    // Voice input state
    const [isListening, setIsListening] = useState(false);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const [isCheckoutMode, setIsCheckoutMode] = useState(false);
    const [recognitionSupported, setRecognitionSupported] = useState(true);
    const [synthesisSupported, setIsSynthesisSupported] = useState(true);
    const [showBrowserNotice, setShowBrowserNotice] = useState(false);
    const [browserCompatWarning, setBrowserCompatWarning] = useState('');
    
    // Voice settings
    const [voiceRate, setVoiceRate] = useState(1.0);
    const [voicePitch, setVoicePitch] = useState(1.0);
    const [voiceVolume, setVoiceVolume] = useState(1.0);
    const [selectedVoice, setSelectedVoice] = useState<SpeechSynthesisVoice | null>(null);
    const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);
    const [continuousListening, setContinuousListening] = useState(false);
    
    // UI state
    const [showSettings, setShowSettings] = useState(false);
    const [showHistory, setShowHistory] = useState(false);
    
    // Voice visualization
    const [visualizerData, setVisualizerData] = useState<number[]>([]);
    
    // Shopping panel state
    const [panelView, setPanelView] = useState<PanelView>('products');
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
    const [shoppingFlowState, setShoppingFlowState] = useState<ShoppingFlowState>('initial');
    const [lastCategory, setLastCategory] = useState<string>('');
    // This is used in handleToolCalls to track the most recent search
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const [lastSearchQuery, setLastSearchQuery] = useState<string>('');
    
    // History state
    const [conversationHistory, setConversationHistory] = useState<ConversationHistoryItem[]>([]);
    const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
    
    // Refs
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const recognitionRef = useRef<SpeechRecognition | null>(null);
    const visualizerRef = useRef<VoiceVisualizer | null>(null);
    const { addToCart, removeFromCart } = useCart();
    
    // Generate a unique ID for each message
    const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Load conversation history from local storage
    useEffect(() => {
        try {
            const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
            if (savedHistory) {
                const parsedHistory = JSON.parse(savedHistory);
                // Convert string dates back to Date objects
                const processedHistory = parsedHistory.map((conversation: any) => ({
                    ...conversation,
                    timestamp: new Date(conversation.timestamp),
                    messages: conversation.messages.map((msg: any) => ({
                        ...msg,
                        timestamp: new Date(msg.timestamp)
                    }))
                }));
                setConversationHistory(processedHistory);
            }
        } catch (error) {
            console.error('Failed to load conversation history:', error);
        }
    }, []);
    
    // Load voice settings from local storage
    useEffect(() => {
        try {
            const savedSettings = localStorage.getItem(VOICE_SETTINGS_KEY);
            if (savedSettings) {
                const { rate, pitch, volume, continuousMode } = JSON.parse(savedSettings);
                setVoiceRate(rate || 1.0);
                setVoicePitch(pitch || 1.0);
                setVoiceVolume(volume || 1.0);
                setContinuousListening(continuousMode || false);
            }
        } catch (error) {
            console.error('Failed to load voice settings:', error);
        }
    }, []);

    // Check for Web Speech API support
    useEffect(() => {
        // Detect browser
        const userAgent = navigator.userAgent;
        const isChrome = /Chrome/.test(userAgent) && !/Edge|Edg/.test(userAgent);
        const isEdge = /Edge|Edg/.test(userAgent);
        const isFirefox = /Firefox/.test(userAgent);
        const isSafari = /Safari/.test(userAgent) && !/Chrome/.test(userAgent);
        
        // Check for SpeechRecognition support
        if (!('webkitSpeechRecognition' in window) && 
            !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported in this browser');
            setRecognitionSupported(false);
            
            // Set browser compatibility warning
            if (isFirefox) {
                setBrowserCompatWarning('Firefox has limited support for voice recognition. For the best experience, try Chrome or Edge.');
                setShowBrowserNotice(true);
            } else if (isSafari) {
                setBrowserCompatWarning('Safari has limited support for voice recognition. For the best experience, try Chrome or Edge.');
                setShowBrowserNotice(true);
            } else {
                setBrowserCompatWarning('Your browser doesn\'t support voice recognition. For the best experience, try Chrome or Edge.');
                setShowBrowserNotice(true);
            }
        } else if (!(isChrome || isEdge)) {
            // For browsers that technically support the API but might have limited functionality
            setBrowserCompatWarning('For the best voice experience, try using Chrome or Edge.');
            setShowBrowserNotice(true);
        }
        
        // Check for Speech Synthesis support
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported in this browser');
            setIsSynthesisSupported(false);
            
            if (!browserCompatWarning) {
                setBrowserCompatWarning('Your browser doesn\'t fully support voice features. For the best experience, try Chrome or Edge.');
                setShowBrowserNotice(true);
            }
        } else {
            // Get available voices
            const loadVoices = () => {
                const voices = window.speechSynthesis.getVoices();
                if (voices.length > 0) {
                    setAvailableVoices(voices);
                    // Set default voice (prefer English)
                    const englishVoice = voices.find(voice => voice.lang.startsWith('en-'));
                    setSelectedVoice(englishVoice || voices[0]);
                }
            };
            
            // Initial load
            loadVoices();
            
            // Chrome loads voices asynchronously
            if (window.speechSynthesis.onvoiceschanged !== undefined) {
                window.speechSynthesis.onvoiceschanged = loadVoices;
            }
        }
    }, [browserCompatWarning]);
    
    // Auto-scroll to the latest message
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    // Focus input when chat opens
    useEffect(() => {
        if (isOpen) {
            inputRef.current?.focus();
        }
    }, [isOpen]);
    
    // Initialize speech recognition
    useEffect(() => {
        if (!recognitionSupported) return;
        
        // Create SpeechRecognition instance
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            const recognition = new SpeechRecognition();
            recognition.continuous = false;
            recognition.interimResults = true;
            recognition.lang = 'en-US';
            
            // Handle recognition results
            recognition.onresult = (event) => {
                const finalTranscript = event.results[0][0].transcript;
                const isFinal = event.results[0].isFinal;
                
                // Update input as user speaks (for interim results)
                setInput(finalTranscript);
                
                // Send message when final result is received
                if (isFinal) {
                    sendMessage(finalTranscript);
                }
            };
            
            // Handle errors
            recognition.onerror = (event) => {
                console.error('Speech recognition error', event.error);
                setIsListening(false);
            };
            
            // Handle end of recognition
            recognition.onend = () => {
                setIsListening(false);
                
                // If continuous listening is enabled, restart recognition
                // unless we're speaking or in checkout mode
                if (continuousListening && !isSpeaking && !isCheckoutMode) {
                    setTimeout(() => {
                        startListening();
                    }, 1000);
                }
                
                // Stop visualizer when recognition ends
                if (visualizerRef.current) {
                    visualizerRef.current.stop();
                }
            };
            
            recognitionRef.current = recognition;
        }
        
        // Clean up on unmount
        return () => {
            if (recognitionRef.current) {
                recognitionRef.current.abort();
            }
            
            if (visualizerRef.current) {
                visualizerRef.current.stop();
            }
        };
    }, [recognitionSupported, continuousListening, isSpeaking, isCheckoutMode]);
    
    // Automatically disable mic during checkout
    useEffect(() => {
        if (isCheckoutMode && isListening) {
            stopListening();
        }
    }, [isCheckoutMode, isListening]);
    
    // Save voice settings when they change
    useEffect(() => {
        try {
            localStorage.setItem(VOICE_SETTINGS_KEY, JSON.stringify({
                rate: voiceRate,
                pitch: voicePitch,
                volume: voiceVolume,
                continuousMode: continuousListening
            }));
        } catch (error) {
            console.error('Failed to save voice settings:', error);
        }
    }, [voiceRate, voicePitch, voiceVolume, continuousListening]);
    
    // Save conversation history when it changes
    useEffect(() => {
        try {
            // Before saving, we need to make sure the messages are in the format expected by ConversationHistory
            const historyWithConvertedMessages = conversationHistory.map(convo => ({
                ...convo,
                messages: convertToLegacyMessageFormat(
                    // @ts-ignore - we're handling the conversion between message formats
                    convo.messages
                )
            }));
            
            localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(historyWithConvertedMessages));
        } catch (error) {
            console.error('Failed to save conversation history:', error);
        }
    }, [conversationHistory]);
    
    // Setup keyboard shortcuts
    useEffect(() => {
        if (!isOpen) return;
        
        const handleKeyDown = (e: KeyboardEvent) => {
            // Space to toggle listening (but not if we're typing in the input field)
            if (e.code === 'Space' && document.activeElement !== inputRef.current) {
                e.preventDefault();
                toggleListening();
            }
            
            // Escape to close the chat
            if (e.code === 'Escape') {
                toggleChat();
            }
            
            // Ctrl + / to toggle settings
            if (e.code === 'Slash' && e.ctrlKey) {
                e.preventDefault();
                setShowSettings(prev => !prev);
            }
        };
        
        window.addEventListener('keydown', handleKeyDown);
        
        return () => {
            window.removeEventListener('keydown', handleKeyDown);
        };
    }, [isOpen, isListening]);
    
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };
    
    const startListening = async () => {
        if (isCheckoutMode || isListening) return;
        
        if (recognitionRef.current) {
            try {
                // Initialize and start visualizer
                if (!visualizerRef.current) {
                    visualizerRef.current = new VoiceVisualizer((data) => {
                        const visualData = getVisualizerData(data, 20);
                        setVisualizerData(visualData);
                    });
                }
                
                if (!visualizerRef.current.isActive()) {
                    const initialized = await visualizerRef.current.initialize();
                    if (initialized) {
                        visualizerRef.current.start();
                    }
                }
                
                // Start speech recognition
                recognitionRef.current.start();
                setIsListening(true);
            } catch (error) {
                console.error('Failed to start speech recognition:', error);
                setIsListening(false);
            }
        }
    };
    
    const stopListening = () => {
        if (recognitionRef.current) {
            try {
                recognitionRef.current.abort();
                setIsListening(false);
                
                // Stop visualizer
                if (visualizerRef.current) {
                    visualizerRef.current.stop();
                    setVisualizerData([]);
                }
            } catch (error) {
                console.error('Failed to stop speech recognition:', error);
            }
        }
    };
    
    const toggleListening = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
        }
    };
    
    const speakText = (text: string) => {
        if (!synthesisSupported || isCheckoutMode) return;
        
        // Cancel any ongoing speech
        window.speechSynthesis.cancel();
        
        // Create a new utterance
        const utterance = new SpeechSynthesisUtterance(text);
        
        // Apply voice settings
        if (selectedVoice) {
            utterance.voice = selectedVoice;
        }
        utterance.lang = 'en-US';
        utterance.rate = voiceRate;
        utterance.pitch = voicePitch;
        utterance.volume = voiceVolume;
        
        // Handle speaking states
        utterance.onstart = () => setIsSpeaking(true);
        utterance.onend = () => {
            setIsSpeaking(false);
            
            // If continuous listening is enabled and we're not in checkout mode,
            // restart recognition after speaking is done
            if (continuousListening && !isCheckoutMode) {
                setTimeout(() => {
                    startListening();
                }, 500);
            }
        };
        utterance.onerror = () => setIsSpeaking(false);
        
        // Speak the text
        window.speechSynthesis.speak(utterance);
    };
    
    // Handle tool calls received from the backend
    const handleToolCalls = async (toolCalls: ToolCall[]) => {
        for (const toolCall of toolCalls) {
            const { name, arguments: args } = toolCall.function;
            
            switch (name) {
                case 'searchProducts':
                    setSearchQuery(args.query);
                    setPanelView('products');
                    
                    // Update shopping flow state
                    if (isProductCategory(args.query)) {
                        setShoppingFlowState('browsing_products');
                        setLastCategory(args.query);
                    } else {
                        setShoppingFlowState('browsing_products');
                        setLastSearchQuery(args.query);
                    }
                    break;
                    
                case 'showProduct':
                    setSelectedProductId(args.id);
                    setPanelView('product-detail');
                    setShoppingFlowState('viewing_product');
                    
                    // Consider suggesting related items or accessories after showing a product
                    // This could be enhanced to use actual product relationships from the API
                    if (args.id && args.category) {
                        suggestRelatedItems(args.category);
                    }
                    break;
                    
                case 'addToCart':
                    try {
                        if (args.id) {
                            await addToCart(parseInt(args.id), 1);
                            // Keep track that we're looking at a product
                            // but now with something in cart
                            setShoppingFlowState('viewing_product');
                            
                            // After adding to cart, consider suggesting complementary items
                            if (args.category) {
                                suggestComplementaryItems(args.category);
                            }
                        }
                    } catch (error) {
                        console.error('Error adding to cart:', error);
                    }
                    break;
                    
                case 'removeFromCart':
                    try {
                        if (args.id) {
                            await removeFromCart(parseInt(args.id));
                            // After removing from cart, user is likely in cart view
                            setShoppingFlowState('cart');
                        }
                    } catch (error) {
                        console.error('Error removing from cart:', error);
                    }
                    break;
                    
                case 'openCheckout':
                    setPanelView('checkout');
                    setIsCheckoutMode(true);
                    setShoppingFlowState('checkout');
                    break;
                    
                default:
                    console.warn(`Unknown tool call: ${name}`);
            }
        }
    };
    
    // Suggest related items based on the current product
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const suggestRelatedItems = (category: string) => {
        // This could be enhanced to make an actual API call for related products
        // For now, we'll just add a suggestion message
        
        // Don't suggest for every product view to avoid being too pushy
        // Use a random factor to only suggest sometimes
        if (Math.random() > 0.7) {
            setTimeout(() => {
                let suggestionMessage = '';
                
                switch(category.toLowerCase()) {
                    case 'phones':
                        suggestionMessage = "Would you like to see phone cases or screen protectors that go with this device?";
                        break;
                    case 'laptops':
                        suggestionMessage = "You might also be interested in laptop bags, external mice, or keyboard accessories.";
                        break;
                    case 'accessories':
                        suggestionMessage = "We have other accessories that complement this item. Would you like to see them?";
                        break;
                    case 'furniture':
                        suggestionMessage = "Customers who bought this furniture item also viewed our matching pieces.";
                        break;
                    case 'shoes':
                        suggestionMessage = "Would you like to see socks or shoe care products that go well with these?";
                        break;
                    case 'clothes':
                        suggestionMessage = "We have other clothing items that would match well with this. Would you like to see them?";
                        break;
                    default:
                        suggestionMessage = "Would you like to see other similar products?";
                }
                
                // Add the suggestion as a message from the assistant
                const assistantMessage: Message = {
                    id: generateId(),
                    role: 'assistant',
                    content: suggestionMessage,
                    timestamp: new Date()
                };
                
                setMessages(prevMessages => [...prevMessages, assistantMessage]);
                
                // Speak the suggestion if voice is enabled
                if (selectedVoice && synthesisSupported) {
                    speak(suggestionMessage);
                }
            }, 5000); // Delay the suggestion slightly
        }
    };
    
    // Suggest complementary items after adding something to cart
    const suggestComplementaryItems = (category: string) => {
        // Similar to above, this could be enhanced with real API data
        // Only suggest occasionally
        if (Math.random() > 0.5) {
            setTimeout(() => {
                let upsellMessage = '';
                
                switch(category.toLowerCase()) {
                    case 'phones':
                        upsellMessage = "Great choice! Many customers also add a premium screen protector and wireless charger to their order.";
                        break;
                    case 'laptops':
                        upsellMessage = "Would you like to add a laptop case or extended warranty to your purchase?";
                        break;
                    case 'accessories':
                        upsellMessage = "This item is eligible for a bundle discount if you add related accessories.";
                        break;
                    case 'furniture':
                        upsellMessage = "Would you like to check out our furniture care kits to keep your new purchase looking great?";
                        break;
                    case 'shoes':
                        upsellMessage = "We're running a special on shoe care kits that can extend the life of your new shoes.";
                        break;
                    case 'clothes':
                        upsellMessage = "Complete your look! We have matching items that would go perfectly with what's in your cart.";
                        break;
                    default:
                        upsellMessage = "Would you like to see other items that go well with your selection?";
                }
                
                // Add the upsell as a message from the assistant
                const assistantMessage: Message = {
                    id: generateId(),
                    role: 'assistant',
                    content: upsellMessage,
                    timestamp: new Date()
                };
                
                setMessages(prevMessages => [...prevMessages, assistantMessage]);
                
                // Speak the upsell if voice is enabled
                if (selectedVoice && synthesisSupported) {
                    speak(upsellMessage);
                }
            }, 3000); // Shorter delay for cart additions
        }
    };
    
    // Helper function to check if a query is likely a product category from e-com store
    const isProductCategory = (query: string): boolean => {
        const categories = [
            'phones', 'phone', 'smartphone', 'smartphones',
            'laptops', 'laptop', 'computer', 'computers',
            'accessories', 'accessory',
            'furniture', 'chair', 'table', 'desk', 'sofa', 'couch',
            'shoes', 'shoe', 'sneakers', 'boots', 'sandals',
            'clothes', 'clothing', 'shirt', 't-shirt', 'pants', 'dress', 'jacket'
        ];
        
        return categories.some(category => 
            query.toLowerCase().includes(category.toLowerCase())
        );
    };

    // Wrapper for the speech synthesis function to be more consistent with the rest of the code
    const speak = (text: string) => {
        speakText(text);
    };

    const sendMessage = async (messageText: string) => {
        if (!messageText.trim()) return;
        
        // Create a new message with a truly unique ID
        const userMessage: Message = {
            id: generateId(),
            role: 'user',
            content: messageText,
        };
        
        // Update the messages array
        setMessages(prevMessages => [...prevMessages, userMessage]);
        
        // Analyze user message for shopping intent
        analyzeUserMessage(messageText);
        
        // Clear the input
        setInput('');
        
        try {
            setLoading(true);
            
            // Check if the user is asking about products not offered by e-com
            const nonEcomProductQuery = checkForNonEcomProducts(messageText);
            if (nonEcomProductQuery) {
                // Create a canned response explaining store limitations
                const assistantMessage: Message = {
                    id: generateId(),
                    role: 'assistant',
                    content: `I'm sorry, but e-com currently only offers products in these categories: phones, laptops, accessories, furniture, shoes, and clothes. We don't currently carry ${nonEcomProductQuery}. Is there something from our available categories I can help you find?`,
                    timestamp: new Date()
                };
                
                setMessages(prevMessages => [...prevMessages, assistantMessage]);
                
                // Speak the response if voice is enabled
                if (selectedVoice && synthesisSupported) {
                    speak(assistantMessage.content);
                }
                
                setLoading(false);
                return;
            }
            
            // Send the message to the API
            const response = await api.chatWithToolCalls(messageText);
            
            if (!response.success) {
                throw new Error(response.error || 'Network response was not ok');
            }
            
            // Include shopping context in debug messages
            if (process.env.NODE_ENV === 'development') {
                console.debug('Shopping context:', { shoppingFlowState, lastCategory, lastSearchQuery, selectedProductId });
            }
            
            // Extract the response data
            const message = response.message || response.data?.reply || '';
            const toolCalls = response.data?.toolCalls || [];
            
            // Always add the assistant's response to the messages, even if empty
            // The content may be empty if the response only includes tool calls
            const assistantMessage: Message = {
                id: generateId(),
                role: 'assistant',
                content: message,
                toolCalls: toolCalls.length > 0 ? toolCalls : undefined
            };
            
            setMessages(prevMessages => [...prevMessages, assistantMessage]);
            
            // Process tool calls if present
            if (toolCalls && toolCalls.length > 0) {
                await handleToolCalls(toolCalls);
            } 
            
            // Update state based on message content if there's a message
            if (message) {
                updateStateFromAssistantMessage(message);
                
                // Speak the assistant's response if voice mode is enabled
                if (selectedVoice && synthesisSupported) {
                    speak(message);
                }
            } else if (toolCalls.length === 0) {
                // Only show error if there's no message AND no tool calls
                console.error('Empty response from API', response);
                // Add a fallback message
                const fallbackMessage: Message = {
                    id: generateId(),
                    role: 'assistant',
                    content: 'I apologize, but I seem to be having trouble right now. Please try again or contact support if the issue persists.',
                };
                
                setMessages(prevMessages => [...prevMessages, fallbackMessage]);
            }
        } catch (error) {
            console.error('Error sending message:', error);
            
            // Add an error message
            const errorMessage: Message = {
                id: generateId(),
                role: 'assistant',
                content: 'I apologize, but I encountered an error while processing your request. Please try again later.',
            };
            
            setMessages(prevMessages => [...prevMessages, errorMessage]);
        } finally {
            setLoading(false);
        }
    };
    
    // Helper function to check if user is asking about products not offered by e-com
    const checkForNonEcomProducts = (message: string): string | null => {
        const lowerMessage = message.toLowerCase();
        
        // Define products/categories not offered by e-com
        const nonEcomProducts = [
            { terms: ['book', 'books', 'novel', 'textbook'], category: 'books' },
            { terms: ['food', 'grocery', 'groceries', 'fruit', 'vegetable'], category: 'groceries' },
            { terms: ['toy', 'toys', 'game', 'games', 'board game'], category: 'toys and games' },
            { terms: ['video game', 'console', 'playstation', 'xbox', 'nintendo'], category: 'video games' },
            { terms: ['makeup', 'cosmetic', 'cosmetics', 'beauty'], category: 'beauty products' },
            { terms: ['medicine', 'drug', 'pharmaceutical', 'pharmacy', 'prescription'], category: 'medicine' },
            { terms: ['car', 'automobile', 'vehicle', 'automotive'], category: 'automotive products' },
            { terms: ['garden', 'plant', 'flower', 'seed', 'gardening'], category: 'garden supplies' },
            { terms: ['pet', 'dog', 'cat', 'fish', 'animal'], category: 'pet supplies' },
            { terms: ['kitchen', 'cookware', 'appliance', 'appliances'], category: 'kitchen appliances' }
        ];
        
        // Check if message contains request for non-ecom products
        // But make sure it's not just comparing products to something we do sell
        for (const product of nonEcomProducts) {
            if (product.terms.some(term => lowerMessage.includes(term))) {
                // Make sure it's actually asking about these products
                // and not just comparing with our categories
                const askingPattern = new RegExp(`(do you (have|sell|offer)|looking for|want to buy|where are( the)?) .*(${product.terms.join('|')})`, 'i');
                const comparingPattern = new RegExp(`(compare|versus|vs|like|similar to) .*(${['phone', 'laptop', 'furniture', 'accessory', 'accessories', 'shoe', 'clothing'].join('|')})`, 'i');
                
                if (askingPattern.test(lowerMessage) && !comparingPattern.test(lowerMessage)) {
                    return product.category;
                }
            }
        }
        
        return null;
    };
    
    // Analyze user message to detect shopping intent and update state for e-com store
    const analyzeUserMessage = (message: string) => {
        const lowerMessage = message.toLowerCase();
        
        // Check for greetings or general inquiries - reset state
        if (/^(hi|hello|hey|greetings|howdy|what can you do|help me)/i.test(lowerMessage)) {
            setShoppingFlowState('initial');
            return;
        }
        
        // Check for checkout intent
        if (/checkout|buy now|purchase|complete order|proceed to payment/i.test(lowerMessage)) {
            setShoppingFlowState('checkout');
            return;
        }
        
        // Check for cart intent
        if (/cart|shopping bag|my items|show cart|view cart/i.test(lowerMessage)) {
            setShoppingFlowState('cart');
            return;
        }
        
        // Check for category browsing intent
        if (isProductCategory(lowerMessage)) {
            setShoppingFlowState('browsing_products');
            const category = extractCategory(lowerMessage);
            if (category) {
                setLastCategory(category);
            }
            return;
        }
        
        // Check for comparison or recommendation requests
        if (/compare|vs|versus|difference between|recommend|suggestion|best|top rated/i.test(lowerMessage)) {
            // Keep browsing state, but note that we're looking for comparisons/recommendations
            if (shoppingFlowState !== 'browsing_products' && shoppingFlowState !== 'viewing_product') {
                setShoppingFlowState('browsing_products');
            }
            return;
        }
        
        // If user is asking about specific product features while in viewing_product state, maintain that state
        if (shoppingFlowState === 'viewing_product' && 
            /features|specs|specification|compare|details|description|color|size|price/i.test(lowerMessage)) {
            // Keep the current state
            return;
        }
        
        // If asking about store info or policies
        if (/store (hours|location)|shipping|delivery|return policy|warranty/i.test(lowerMessage)) {
            // This doesn't change the shopping state but could be handled by the AI response
            return;
        }
        
        // If asking about products not in e-com categories
        if (/book|food|grocery|toy|game|video game|console|makeup|cosmetic|medicine|drug/i.test(lowerMessage) &&
            !isProductCategory(lowerMessage)) {
            // Don't change state - the AI response will explain the store only offers certain categories
            return;
        }
        
        // If none of the above, we maintain current state as the context might be continuing the current flow
    };
    
    // Extract the most likely category from a message for e-com store
    const extractCategory = (message: string): string => {
        const categories = [
            { key: 'phones', terms: ['phones', 'phone', 'smartphone', 'smartphones', 'cell phone', 'mobile phone'] },
            { key: 'laptops', terms: ['laptops', 'laptop', 'computer', 'computers', 'notebook', 'netbook'] },
            { key: 'accessories', terms: ['accessories', 'accessory', 'charger', 'case', 'headphones', 'earbuds'] },
            { key: 'furniture', terms: ['furniture', 'chair', 'table', 'desk', 'sofa', 'couch', 'bed', 'shelf'] },
            { key: 'shoes', terms: ['shoes', 'shoe', 'sneakers', 'boots', 'sandals', 'footwear'] },
            { key: 'clothes', terms: ['clothes', 'clothing', 'shirt', 't-shirt', 'pants', 'dress', 'jacket', 'apparel'] }
        ];
        
        const lowerMessage = message.toLowerCase();
        
        for (const category of categories) {
            if (category.terms.some(term => lowerMessage.includes(term))) {
                return category.key;
            }
        }
        
        return '';
    };
    
    // Update state based on assistant message content when no tool calls for e-com store
    const updateStateFromAssistantMessage = (message: string) => {
        const lowerMessage = message.toLowerCase();
        
        // If assistant is suggesting products or categories
        if (/would you like to see|i can show you|here are some|we have several/i.test(lowerMessage) &&
            isProductCategory(lowerMessage)) {
            setShoppingFlowState('browsing_products');
            const category = extractCategory(lowerMessage);
            if (category) {
                setLastCategory(category);
            }
        }
        
        // If assistant is describing a specific product
        if (/this product|this (smartphone|phone|laptop|device|item)|features include/i.test(lowerMessage) && 
            shoppingFlowState !== 'viewing_product') {
            setShoppingFlowState('viewing_product');
        }
        
        // If assistant is talking about cart
        if (/your cart|shopping cart|items in your cart|added to your cart/i.test(lowerMessage)) {
            setShoppingFlowState('cart');
        }
        
        // If assistant is talking about checkout
        if (/checkout process|payment options|shipping information|complete your purchase/i.test(lowerMessage)) {
            setShoppingFlowState('checkout');
        }
        
        // If assistant is explaining store offerings/limitations
        if (/currently only offers|we only sell|we specialize in|we don't currently sell|we don't offer/i.test(lowerMessage)) {
            // Keep the current state, but we could potentially reset to initial if implementing that behavior
            if (shoppingFlowState === 'initial') {
                // Stay in initial state
            }
        }
        
        // If assistant is making product recommendations or upsells
        if (/might also like|also consider|goes well with|customers also bought|complementary|accessory for/i.test(lowerMessage)) {
            // Keep the current state since recommendations are contextual to current flow
            // This helps maintain context for further exploration
        }
    };

    const handleKeyPress = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            if (input.trim()) {
                sendMessage(input);
            }
        }
    };

    const toggleChat = () => {
        setIsOpen(prev => !prev);
        if (!isOpen) {
            // Close any open panels
            setShowSettings(false);
            setShowHistory(false);
            
            // Start a new conversation
            setActiveConversationId(null);
            
            // Send welcome message when chat is opened
            const welcomeMessage = "Welcome to e-com! I'm your AI shopping assistant.";
            const storeInfo = "I can help you browse phones, laptops, accessories, furniture, shoes, and clothes.";
            const voiceTip = recognitionSupported ? 
                "Click the microphone button or press Space to speak, or type your questions." : 
                "Type your questions and I'll help you find what you need.";
            
            setMessages([{ 
                id: generateId(),
                role: 'assistant', 
                content: `${welcomeMessage} ${storeInfo} ${voiceTip} How can I help you today?`,
                timestamp: new Date()
            }]);
            
            // Speak the welcome message
            speakText(`${welcomeMessage} ${storeInfo} ${voiceTip} How can I help you today?`);
        } else {
            // Stop any ongoing speech when closing
            window.speechSynthesis.cancel();
            
            // Stop listening if active
            if (isListening) {
                stopListening();
            }
        }
    };
    
    const exitCheckoutMode = () => {
        setIsCheckoutMode(false);
        setPanelView('products');
    };
    
    // Update shopping flow state when panel view changes
    useEffect(() => {
        if (panelView === 'products') {
            setShoppingFlowState('browsing_products');
        } else if (panelView === 'product-detail') {
            setShoppingFlowState('viewing_product');
        } else if (panelView === 'cart') {
            setShoppingFlowState('cart');
        } else if (panelView === 'checkout') {
            setShoppingFlowState('checkout');
        }
    }, [panelView]);
    
    const startNewConversation = () => {
        // Clear current messages
        setMessages([{ 
            id: generateId(),
            role: 'assistant', 
            content: "Welcome back to e-com! I'm ready to help you find phones, laptops, accessories, furniture, shoes, or clothes. What are you looking for today?",
            timestamp: new Date()
        }]);
        
        // Reset active conversation
        setActiveConversationId(null);
        
        // Close history panel
        setShowHistory(false);
    };
    
    // Helper function to convert Message to legacy format expected by ConversationHistory
    const convertToLegacyMessageFormat = (messages: Message[]): any[] => {
        return messages.map(msg => ({
            id: msg.id,
            sender: msg.role === 'user' ? 'user' : 'bot',
            text: msg.content,
            timestamp: msg.timestamp || new Date(),
            toolCalls: msg.toolCalls
        }));
    };
    
    const loadConversation = (conversation: ConversationHistoryItem) => {
        // Convert legacy format messages to new format
        const newFormatMessages = conversation.messages.map(msg => ({
            id: msg.id,
            role: msg.sender === 'user' ? 'user' as const : 'assistant' as const,
            content: msg.text,
            timestamp: msg.timestamp,
            toolCalls: msg.toolCalls
        }));
        
        setMessages(newFormatMessages);
        setActiveConversationId(conversation.id);
        setShowHistory(false);
        
        // Reset the shopping panel
        setPanelView('products');
        setIsCheckoutMode(false);
    };
    
    const deleteConversation = (id: string) => {
        setConversationHistory(prev => prev.filter(conv => conv.id !== id));
        
        // If we deleted the active conversation, start a new one
        if (id === activeConversationId) {
            startNewConversation();
        }
    };
    
    const clearAllHistory = () => {
        if (window.confirm('Are you sure you want to delete all conversation history?')) {
            setConversationHistory([]);
            startNewConversation();
        }
    };

    // Create voice visualization bars
    const renderVoiceVisualization = () => {
        if (!isListening || visualizerData.length === 0) {
            return null;
        }
        
        return (
            <div className="voice-visualization">
                {visualizerData.map((value, index) => (
                    <div 
                        key={index} 
                        className="voice-bar" 
                        style={{
                            height: `${Math.max(5, value * 40)}px`
                        }}
                    />
                ))}
            </div>
        );
    };

    return (
        <>
            {/* Chat toggle button */}
            {!isOpen && (
                <button 
                    onClick={toggleChat}
                    className="chat-toggle-button"
                    aria-label="Open e-com shopping assistant"
                >
                    <div className="toggle-icon-container">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="chat-icon">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z" />
                        </svg>
                        {recognitionSupported && (
                            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="mic-icon">
                                <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                            </svg>
                        )}
                    </div>
                    <span className="toggle-label">e-com Assistant</span>
                </button>
            )}

            {/* Voice Chat container */}
            {isOpen && (
                <div className="voice-chat-container">
                    {/* Chat panel */}
                    <div className="chat-panel">
                        <div className="chat-header">
                            <div className="header-title">
                                <span>e-com Shopping Assistant</span>
                                <div className="header-badges">
                                    {isCheckoutMode && <span className="secure-mode-badge">Secure Mode</span>}
                                    {recognitionSupported && <span className="voice-badge">Voice Enabled</span>}
                                </div>
                            </div>
                            <button onClick={toggleChat} aria-label="Close chat">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>
                        
                        <div className="chat-window">
                            {messages.map((m) => (
                                <ChatBubble 
                                    key={m.id} 
                                    sender={m.role === 'user' ? 'user' : 'bot'} 
                                    text={m.content} 
                                    timestamp={m.timestamp} 
                                />
                            ))}
                            
                            {loading && (
                                <ChatBubble sender="bot" text="..." />
                            )}
                            
                            <div ref={messagesEndRef} />
                        </div>
                        
                        {/* Browser compatibility notice */}
                        {showBrowserNotice && (
                            <div className="browser-compatibility-notice">
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="icon w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
                                </svg>
                                <span>{browserCompatWarning}</span>
                                <button className="close-btn" onClick={() => setShowBrowserNotice(false)}>×</button>
                            </div>
                        )}
                        
                        {/* Voice visualization */}
                        {renderVoiceVisualization()}
                        
                        <div className="chat-input">
                            <div className="input-container">
                                <input
                                    ref={inputRef}
                                    value={input}
                                    onChange={e => setInput(e.target.value)}
                                    onKeyPress={handleKeyPress}
                                    placeholder="Ask about phones, laptops, accessories, furniture, shoes, or clothes..."
                                    disabled={loading || isListening}
                                />
                                
                                {recognitionSupported && !isCheckoutMode && (
                                    <button 
                                        onClick={toggleListening}
                                        className={`mic-button ${isListening ? 'listening' : ''}`}
                                        aria-label={isListening ? "Stop listening" : "Start listening"}
                                        disabled={loading}
                                        title="Click to speak"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                            <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                            
                            <button 
                                onClick={() => input.trim() && sendMessage(input)}
                                className="send-button"
                                disabled={loading || !input.trim()}
                                aria-label="Send message"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Voice status indicators */}
                        {isListening && (
                            <div className="voice-status listening">
                                <div className="voice-pulse"></div>
                                Listening...
                            </div>
                        )}
                        
                        {isSpeaking && (
                            <div className="voice-status speaking">
                                <div className="voice-wave"></div>
                                Speaking...
                            </div>
                        )}
                        
                        {/* Floating action controls */}
                        <div className="floating-controls">
                            <button 
                                className="control-button settings"
                                onClick={() => {
                                    setShowSettings(!showSettings);
                                    setShowHistory(false);
                                }}
                                aria-label="Voice settings"
                                title="Voice Settings"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213 1.281c.063.374.313.686.645.87.074.04.147.083.22.127.324.196.72.257 1.075.124l1.217-.456a1.125 1.125 0 011.37.49l1.296 2.247a1.125 1.125 0 01-.26 1.431l-1.003.827c-.293.24-.438.613-.431.992a6.759 6.759 0 010 .255c-.007.378.138.75.43.99l1.005.828c.424.35.534.954.26 1.43l-1.298 2.247a1.125 1.125 0 01-1.369.491l-1.217-.456c-.355-.133-.75-.072-1.076.124a6.57 6.57 0 01-.22.128c-.331.183-.581.495-.644.869l-.213 1.28c-.09.543-.56.941-1.11.941h-2.594c-.55 0-1.02-.398-1.11-.94l-.213-1.281c-.062-.374-.312-.686-.644-.87a6.52 6.52 0 01-.22-.127c-.325-.196-.72-.257-1.076-.124l-1.217.456a1.125 1.125 0 01-1.369-.49l-1.297-2.247a1.125 1.125 0 01.26-1.431l1.004-.827c.292-.24.437-.613.43-.992a6.932 6.932 0 010-.255c.007-.378-.138-.75-.43-.99l-1.004-.828a1.125 1.125 0 01-.26-1.43l1.297-2.247a1.125 1.125 0 011.37-.491l1.216.456c.356.133.751.072 1.076-.124.072-.044.146-.087.22-.128.332-.183.582-.495.644-.869l.214-1.281z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                </svg>
                            </button>
                            
                            <button 
                                className="control-button history"
                                onClick={() => {
                                    setShowHistory(!showHistory);
                                    setShowSettings(false);
                                }}
                                aria-label="Conversation history"
                                title="Conversation History"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
                                </svg>
                            </button>
                            
                            <button 
                                className="control-button clear"
                                onClick={startNewConversation}
                                aria-label="New conversation"
                                title="New Conversation"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
                                </svg>
                            </button>
                        </div>
                        
                        {/* Voice Settings Panel */}
                        {showSettings && (
                            <VoiceSettingsPanel
                                voiceRate={voiceRate}
                                voicePitch={voicePitch}
                                voiceVolume={voiceVolume}
                                continuousListening={continuousListening}
                                selectedVoice={selectedVoice}
                                availableVoices={availableVoices}
                                onRateChange={setVoiceRate}
                                onPitchChange={setVoicePitch}
                                onVolumeChange={setVoiceVolume}
                                onVoiceChange={setSelectedVoice}
                                onContinuousListeningChange={setContinuousListening}
                                onClose={() => setShowSettings(false)}
                            />
                        )}
                        
                        {/* Conversation History Panel */}
                        {showHistory && (
                            <ConversationHistory
                                history={conversationHistory}
                                activeConversationId={activeConversationId}
                                onSelectConversation={loadConversation}
                                onDeleteConversation={deleteConversation}
                                onClearAllHistory={clearAllHistory}
                                onClose={() => setShowHistory(false)}
                            />
                        )}
                    </div>
                    
                    {/* Shopping panel */}
                    <div className="shopping-panel">
                        <ShoppingPanel 
                            view={panelView}
                            searchQuery={searchQuery}
                            productId={selectedProductId}
                            onCheckoutComplete={exitCheckoutMode}
                            shoppingFlowState={shoppingFlowState}
                            lastCategory={lastCategory}
                        />
                    </div>
                </div>
            )}
        </>
    );
};

export default VoiceChatBot;
