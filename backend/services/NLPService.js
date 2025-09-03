// NLP Service for interacting with Azure OpenAI or other LLM services
import { AzureOpenAI } from 'openai';
import 'dotenv/config';


// quick checks 
console.log("Azure ENV:", {
  key: process.env.AZURE_OPENAI_API_KEY ? "✓ set" : "✗ missing",
  endpoint: process.env.AZURE_OPENAI_ENDPOINT,
  deployment: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
  version: process.env.AZURE_OPENAI_API_VERSION
});


/**
 * Service to handle interactions with the LLM (Azure OpenAI)
 */
class NLPService {
  constructor() {
    this.client = this.initializeClient();
    this.systemPrompt = this.getSystemPrompt();
  }
  

  /**
   * Initialize the OpenAI client
   * @returns {AzureOpenAI|null} The initialized client or null if credentials missing
   */
  initializeClient() {
    try {
      const apiKey = process.env.AZURE_OPENAI_API_KEY;
      const endpoint = process.env.AZURE_OPENAI_ENDPOINT;
      const apiVersion = process.env.AZURE_OPENAI_API_VERSION || '2024-02-15-preview';
      const deployment = process.env.AZURE_OPENAI_DEPLOYMENT_NAME;

      if (!apiKey || !endpoint || !deployment) {
        console.warn(
          '⚠️ Azure OpenAI credentials missing (AZURE_OPENAI_API_KEY, AZURE_OPENAI_ENDPOINT, AZURE_OPENAI_DEPLOYMENT_NAME)'
        );
        return null;
      }

      return new AzureOpenAI({
        apiKey,
        endpoint,
        apiVersion,
      });
    } catch (error) {
      console.error('❌ Failed to initialize NLP service:', error);
      return null;
    }
  }

  /**
   * Get the system prompt for the AI Sales Assistant
   * @returns {string} The system prompt
   */
  getSystemPrompt() {
   return `
You are a persuasive but helpful AI sales assistant for our store.
Principles:

Sell benefits and outcomes, not just specs. Create a feeling of confidence and relief.

Keep replies concise (2–5 sentences) and propose next actions (Add to Cart, Compare, See Alternatives).

Personalize using session context: budget, brand preferences, use-case, prior views.

If out of stock or over budget, suggest 2–3 strong alternatives, explain trade-offs.

Never request or process card numbers, CVV, OTPs, or passwords. Direct users to secure checkout only.

Avoid demographic assumptions and unfair bias. Stay respectful and inclusive.

When user hesitates, address objections (price, compatibility, durability) and provide social proof and guarantees.

If user asks for sensitive operations, respond with a refusal and a safe alternative path.
Output JSON with:
{
"assistant_message": "<short persuasive reply>",
"suggested_products": [ { "productId": 123, "reason": "matches 16GB RAM + budget" }, ... ],
"actions": [ "ADD_TO_CART:123", "SHOW_ALTERNATIVES", "BEGIN_CHECKOUT" ],
"memory_updates": { "budgetMax": 80000, "preferredBrand": "HP", ... }
}
`;
  }

  /**
   * Check if a message contains sensitive information that should be refused
   */
  guardrails(message) {
    const creditCardPattern = /\b(?:\d{4}[-\s]?){3}\d{4}\b/;
    const cvvPattern = /\b(?:cvv|cvc|security code|card code)\s*:?\s*\d{3,4}\b/i;
    const otpPattern = /\b(?:otp|verification code|security code)\s*:?\s*\d{4,8}\b/i;
    const nationalIdPattern = /\b(?:national id|id number|identification number)\s*:?\s*[\w\d-]{6,12}\b/i;
    const passwordPattern = /\b(?:password|pwd|passcode)\s*:?\s*\S{8,}\b/i;

    return (
      creditCardPattern.test(message) ||
      cvvPattern.test(message) ||
      otpPattern.test(message) ||
      nationalIdPattern.test(message) ||
      passwordPattern.test(message)
    );
  }

  /**
   * Generate a response using the LLM
   */
  async generate(userMessage, context, productSummaries = []) {
    if (!this.client) {
      console.warn('⚠️ NLP client not initialized, returning fallback response');
      // Include product IDs in the fallback response if we have products
      if (productSummaries && productSummaries.length > 0) {
        const productIds = productSummaries
          .map(summary => {
            const match = summary.match(/Product ID: (\d+)/);
            return match ? parseInt(match[1], 10) : null;
          })
          .filter(id => id !== null);
          
        console.log(`Including ${productIds.length} products in fallback response`);
        
        return {
          assistant_message: "I found some products that might interest you. Here are some options from our store:",
          suggested_products: productIds.slice(0, 3).map(productId => ({
            productId,
            reason: "Matched your search criteria"
          })),
          actions: [],
          memory_updates: {}
        };
      }
      
      return this.getFallbackResponse(
        "I'm having trouble connecting to my knowledge base right now. Please try again in a moment."
      );
    }

    try {
      // Check for sensitive data
      if (this.guardrails(userMessage)) {
        console.log('🛡️ Guardrails triggered - sensitive data detected');
        return this.getSensitiveDataResponse();
      }

      // Special case for empty product summaries - give a useful response instead of an error
      if (productSummaries.length === 0) {
        console.log('📦 No products found to suggest, using specialized response');
        return {
          assistant_message: "I don't see any products matching your criteria right now. Can you tell me more about what you're looking for? Maybe we can broaden the search or look at other categories.",
          suggested_products: [],
          actions: ["SHOW_ALTERNATIVES"],
          memory_updates: {}
        };
      }

      const formattedMessage = this.formatMessage(userMessage, context, productSummaries);

      const messages = [
        { role: 'system', content: this.systemPrompt },
        ...(context.history || []),
        { role: 'user', content: formattedMessage },
      ];

      console.log(`📡 Calling Azure OpenAI with deployment: ${process.env.AZURE_OPENAI_DEPLOYMENT_NAME}`);
      console.log(`📦 Found ${productSummaries.length} products to suggest`);

      const completion = await this.client.chat.completions.create({
        messages,
        model: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
        temperature: 0.6,
        max_tokens: 800,
      });

      const content = completion.choices[0]?.message?.content || '{}';
      console.log('🤖 Raw LLM content:', content);

      return this.parseResponse(content);
    } catch (error) {
      console.error('❌ Error generating NLP response:', error);
      // Check if this is a specific Azure OpenAI error
      if (error.response && error.response.status) {
        console.error(`Azure OpenAI API error (${error.response.status}): ${error.response.data?.error?.message || 'Unknown API error'}`);
      }
      
      // Return a helpful fallback response
      if (productSummaries.length > 0) {
        // We have products but LLM call failed
        return {
          assistant_message: "I found some products that might interest you, but I'm having trouble analyzing them right now. Can I help you find something specific?",
          suggested_products: productSummaries.slice(0, 3).map((summary, i) => ({
            productId: summary.match(/Product ID: (\d+)/)?.[1] || null,
            reason: "Matched your search criteria"
          })).filter(p => p.productId),
          actions: [],
          memory_updates: {},
        };
      }
      
      return this.getFallbackResponse(
        "I'm sorry, I encountered an error processing your request. How else can I help you today?"
      );
    }
  }

  /**
   * Format the user message with context and product information
   */
  formatMessage(userMessage, context, productSummaries) {
    const { prefs = {} } = context;
    let contextSection = 'Context:\n';

    // Add category mapping to help with product recommendations
    contextSection += 'Available product categories in our store:\n';
    contextSection += '- Phones: smartphones, mobile phones, cell phones\n';
    contextSection += '- Laptops: notebooks, computers, PCs, chromebooks\n';
    contextSection += '- Accessories: cases, chargers, cables, headphones\n';
    contextSection += '- Wearables: smartwatches, fitness trackers\n';
    contextSection += '- Audio: headphones, earbuds, speakers\n';
    contextSection += '- Tablets: iPads, Android tablets\n';
    contextSection += '- Furniture: chairs, desks, tables\n';
    contextSection += '- Clothes: shirts, pants, jackets\n';
    contextSection += '- Shoes: sneakers, boots, sandals\n\n';

    if (Object.keys(prefs).length > 0) {
      contextSection += 'User preferences:\n';
      for (const [key, value] of Object.entries(prefs)) {
        contextSection += `- ${key}: ${value}\n`;
      }
    } else {
      contextSection += 'No user preferences set yet.\n';
    }

    let productsSection = '';
    if (productSummaries.length > 0) {
      productsSection = '\nAvailable products:\n';
      productSummaries.forEach((p, i) => {
        productsSection += `${i + 1}. ${p}\n`;
      });
      
      // Add an instruction to recommend alternatives if products are out of stock
      if (productSummaries.every(summary => summary.includes('Out of stock'))) {
        productsSection += '\nNOTE: All found products are currently out of stock. Recommend suitable alternatives and use the SHOW_ALTERNATIVES action.\n';
      }
    } else {
      productsSection += '\nNOTE: No products found matching the search criteria. Suggest looking in other categories or broaden the search terms.\n';
    }

    return `${userMessage}\n\n${contextSection}${productsSection}`;
  }

  /**
   * Parse the JSON response from the LLM
   */
  parseResponse(content) {
    try {
      // Find the JSON object in the content - sometimes LLMs add extra text
      const jsonMatch = content.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        console.warn('⚠️ No JSON found in LLM response:', content);
        return this.getFallbackResponse(
          "I'm here to help you find the perfect product. What specific features or price range are you looking for?"
        );
      }
      
      const jsonString = jsonMatch[0];
      let parsed;
      
      try {
        parsed = JSON.parse(jsonString);
      } catch (jsonError) {
        console.error('⚠️ Failed to parse JSON from LLM response:', jsonError);
        console.log('Problem JSON string:', jsonString);
        // Try to fix common JSON issues and parse again
        const fixedJson = jsonString
          .replace(/,(\s*[}\]])/g, '$1') // Remove trailing commas
          .replace(/'/g, '"')           // Replace single quotes with double quotes
          .replace(/(\w+):/g, '"$1":'); // Add quotes to property names
          
        try {
          parsed = JSON.parse(fixedJson);
          console.log('✅ Successfully parsed JSON after fixing format issues');
        } catch (fixError) {
          console.error('❌ Still failed to parse JSON after fixes:', fixError);
          return this.getFallbackResponse(
            "I found some great options for you. How else can I help with your shopping today?"
          );
        }
      }

      // Ensure suggested_products is an array, even if empty
      const suggestedProducts = Array.isArray(parsed.suggested_products) ? parsed.suggested_products : [];
      
      // Ensure actions is an array
      let actions = Array.isArray(parsed.actions) ? parsed.actions : [];
      
      // When we have out of stock products, make sure SHOW_ALTERNATIVES is included in actions
      if (actions.includes('SHOW_ALTERNATIVES') && suggestedProducts.length === 0) {
        // We're already showing the correct action, just ensure we have the message
        return {
          assistant_message: parsed.assistant_message || 
            "Those items appear to be out of stock right now. Would you like me to suggest some alternatives?",
          suggested_products: suggestedProducts,
          actions: actions,
          memory_updates: parsed.memory_updates || {},
        };
      }

      return {
        assistant_message:
          parsed.assistant_message ||
          "I'm here to help you find the perfect product. What are you looking for today?",
        suggested_products: suggestedProducts,
        actions: actions,
        memory_updates: parsed.memory_updates || {},
      };
    } catch (error) {
      console.error('⚠️ Error parsing LLM response:', error);
      return this.getFallbackResponse(
        "I found some great options for you. How else can I help with your shopping today?"
      );
    }
  }

  getFallbackResponse(message) {
    return {
      assistant_message: message,
      suggested_products: [],
      actions: [],
      memory_updates: {},
    };
  }

  getSensitiveDataResponse() {
    return {
      assistant_message:
        "I notice you may have shared sensitive information like card details or passwords. For your security, I'm programmed not to process this data. Please use our secure checkout instead.",
      suggested_products: [],
      actions: ['BEGIN_CHECKOUT'],
      memory_updates: {},
    };
  }
}

export default new NLPService();
