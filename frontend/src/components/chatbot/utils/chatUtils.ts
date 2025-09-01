import type { Message } from '../types/chatTypes';

// Utility functions for the Voice Chat Bot

// Generate a unique ID for each message
export const generateId = () => `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Local storage keys
export const HISTORY_STORAGE_KEY = 'voice-chat-history';
export const VOICE_SETTINGS_KEY = 'voice-chat-settings';

// Check if a query is likely a product category
export const isProductCategory = (query: string): boolean => {
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

// Extract the most likely category from a message
export const extractCategory = (message: string): string => {
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

// Check for non-ecom products
export const checkForNonEcomProducts = (message: string): string | null => {
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
    for (const product of nonEcomProducts) {
        if (product.terms.some(term => lowerMessage.includes(term))) {
            const askingPattern = new RegExp(`(do you (have|sell|offer)|looking for|want to buy|where are( the)?) .*(${product.terms.join('|')})`, 'i');
            const comparingPattern = new RegExp(`(compare|versus|vs|like|similar to) .*(${['phone', 'laptop', 'furniture', 'accessory', 'accessories', 'shoe', 'clothing'].join('|')})`, 'i');
            
            if (askingPattern.test(lowerMessage) && !comparingPattern.test(lowerMessage)) {
                return product.category;
            }
        }
    }
    
    return null;
};

// Convert new message format to legacy format
export const convertToLegacyMessageFormat = (messages: Message[]): any[] => {
    return messages.map(msg => ({
        id: msg.id,
        sender: msg.role === 'user' ? 'user' : 'bot',
        text: msg.content,
    timestamp: msg.timestamp || new Date(),
    toolCalls: msg.toolCalls,
    // Preserve products for potential future migration; legacy UI ignores it
    products: msg.products
    }));
};
