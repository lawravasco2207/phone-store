// Function to analyze user request for product search
import { AzureOpenAI } from 'openai';
import 'dotenv/config';

// Create Azure OpenAI client
function getAzureClient() {
  try {
    const apiKey = process.env.AZURE_OPENAI_API_KEY;
    const baseURL = process.env.AZURE_OPENAI_ENDPOINT;
    const apiVersion = process.env.OPENAI_API_VERSION || process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
    
    if (!apiKey || !baseURL) {
      console.warn('Azure OpenAI credentials missing (AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT)');
      return null;
    }
    
    return new AzureOpenAI({ apiKey, baseURL, apiVersion });
  } catch (error) {
    console.error('Failed to initialize Azure OpenAI client:', error);
    return null;
  }
}

/**
 * Analyzes user message to extract product search parameters
 * @param {string} message - User's message
 * @returns {Promise<Object>} - Extracted search parameters
 */
export async function analyzeUserRequest(message) {
  const client = getAzureClient();
  
  if (!client) {
    // If we can't use AI, do basic keyword extraction
    return basicKeywordExtraction(message);
  }
  
  try {
    const completion = await client.chat.completions.create({
      messages: [
        { 
          role: 'system', 
          content: `You are a product search analyzer. Extract search parameters from user messages.
          - Extract category (product type like laptop, phone, headphones)
          - Extract budget/price range (maxPrice as a number)
          - Extract purpose/use case (gaming, programming, office work, etc.)
          - Extract any specific features or requirements
          - Format all extracted keywords into a search query
          
          Respond in JSON format with these fields:
          {
            "category": string or null,
            "maxPrice": number or null,
            "minPrice": number or null,
            "purpose": string or null,
            "query": string (keywords for search)
          }
          `
        },
        { role: 'user', content: message }
      ],
      response_format: { type: "json_object" }
    });
    
    const response = completion.choices[0]?.message?.content || "{}";
    
    try {
      // Parse the JSON response
      const parsedResponse = JSON.parse(response);
      
      // Ensure we have a proper query
      if (!parsedResponse.query && message) {
        parsedResponse.query = message;
      }
      
      return parsedResponse;
    } catch (parseError) {
      console.error('Error parsing AI response:', parseError);
      return basicKeywordExtraction(message);
    }
  } catch (error) {
    console.error('Error analyzing user request with AI:', error);
    return basicKeywordExtraction(message);
  }
}

/**
 * Fallback function for basic keyword extraction
 * @param {string} message - User's message
 * @returns {Object} - Extracted search parameters
 */
function basicKeywordExtraction(message) {
  const result = {
    category: null,
    maxPrice: null,
    minPrice: null,
    purpose: null,
    query: message
  };
  
  // Extract price/budget with regex
  const priceRegex = /under\s*\$?(\d+)/i;
  const priceMatch = message.match(priceRegex);
  if (priceMatch && priceMatch[1]) {
    result.maxPrice = parseInt(priceMatch[1], 10);
  }
  
  // Simple category extraction
  const categories = [
    'laptop', 'computer', 'phone', 'smartphone', 'mobile', 'headphones', 
    'earbuds', 'tablet', 'camera', 'watch', 'smartwatch', 'tv', 'television'
  ];
  
  for (const category of categories) {
    if (message.toLowerCase().includes(category)) {
      result.category = category;
      break;
    }
  }
  
  // Simple purpose extraction
  const purposes = [
    'gaming', 'programming', 'coding', 'office', 'business', 
    'school', 'student', 'photo', 'photography', 'video', 'streaming'
  ];
  
  for (const purpose of purposes) {
    if (message.toLowerCase().includes(purpose)) {
      result.purpose = purpose;
      break;
    }
  }
  
  return result;
}

export default analyzeUserRequest;
