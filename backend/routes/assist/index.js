// Routes for the AI Sales Assistant
import express from 'express';
import ConversationService from '../../services/ConversationService.js';
import NLPService from '../../services/NLPService.js';
import ProductService from '../../services/ProductService.js';
import PersonaService from '../../services/PersonaService.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Setup rate limiting for the assistant endpoints
const assistRateLimit = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute
  standardHeaders: true,
  message: { success: false, error: 'Too many requests, please try again later' }
});

/**
 * Middleware to extract and validate session ID
 */
const sessionMiddleware = (req, res, next) => {
  let { sessionId } = req.body;
  
  // Generate a new session ID if not provided
  if (!sessionId) {
    sessionId = ConversationService.generateSessionId();
  }
  
  req.sessionId = sessionId;
  next();
};

/**
 * Middleware to check for sensitive information
 */
const sensitiveDataMiddleware = (req, res, next) => {
  const { message } = req.body;
  
  if (message && NLPService.guardrails(message)) {
    // If sensitive data detected, respond with a security message
    return res.json({
      success: true,
      sessionId: req.sessionId,
      assistant_message: "For security reasons, I cannot process messages containing sensitive information like card numbers, CVV codes, passwords, or OTPs. Please use our secure checkout process instead.",
      suggested_products: [],
      actions: ["BEGIN_CHECKOUT"],
      memory_updates: {}
    });
  }
  
  next();
};

// POST /api/assist/send - Main endpoint to interact with the AI Sales Assistant
router.post('/send', assistRateLimit, sessionMiddleware, sensitiveDataMiddleware, async (req, res) => {
  const { message, context = {} } = req.body;
  const sessionId = req.sessionId;
  const userId = req.user?.id; // From auth middleware if available
  
  try {
    const startTime = Date.now();
    
    // Get conversation memory for this session
    const memory = await ConversationService.getMemory(sessionId);
    
    // Add additional context from the request
    const fullContext = {
      ...memory,
      ...context
    };
    
    // Add the user message to the conversation history
    await ConversationService.addMessage(sessionId, 'user', message, userId);
    
    // Extract intent/entities to determine product search parameters
    const searchParams = {
      text: message,
      budget: fullContext.prefs.budgetMax || null,
      category: fullContext.prefs.category || null,
      brand: fullContext.prefs.preferredBrand || null
    };
    
    // Search for relevant products
    let products = [];
    try {
      products = await ProductService.search(searchParams);
    } catch (searchError) {
      console.error('Error searching products:', searchError);
      // Continue with empty products array instead of failing
      products = [];
    }
    
    // Create product summaries for the LLM
    const productSummaries = products.map(product => 
      ProductService.summarizeForLLM(product)
    );
    
    // Generate AI response
    const nlpResponse = await NLPService.generate(
      message,
      fullContext,
      productSummaries
    );
    
    // Update conversation memory with new preferences
    if (nlpResponse.memory_updates && Object.keys(nlpResponse.memory_updates).length > 0) {
      await ConversationService.updateMemory(sessionId, nlpResponse.memory_updates);
    }
    
    // Add the assistant's response to conversation history
    await ConversationService.addMessage(sessionId, 'assistant', nlpResponse.assistant_message, userId);
    
    // Get full product details for the suggested products
    let suggestedProductIds = nlpResponse.suggested_products
      .map(p => p.productId)
      .filter(id => id); // Filter out any undefined or null IDs
    
    // If no suggested products but we have SHOW_ALTERNATIVES action, add the original search results 
    // as alternative suggestions
    if (suggestedProductIds.length === 0 && nlpResponse.actions.includes('SHOW_ALTERNATIVES') && products.length > 0) {
      // Get IDs from the original search results
      suggestedProductIds = products.slice(0, 3).map(p => p.id);
    }
      
    const productDetails = await ProductService.getProductsByIds(suggestedProductIds);
    
    // Enhance product details with reasons from NLP response
    const enhancedProducts = productDetails.map(product => {
      const suggestion = nlpResponse.suggested_products.find(p => p.productId === product.id);
      return {
        ...product,
        reason: suggestion ? suggestion.reason : 'Alternative option based on your search'
      };
    });
    
    // Calculate performance metrics
    const duration = Date.now() - startTime;
    
    // Log minimal telemetry (no sensitive content)
    console.log(`[AI Assistant] sessionId=${sessionId} duration=${duration}ms products=${enhancedProducts.length}`);
    
    // Return the response
    res.json({
      success: true,
      sessionId,
      assistant_message: nlpResponse.assistant_message,
      suggested_products: enhancedProducts,
      actions: nlpResponse.actions
    });
  } catch (error) {
    console.error('Error in AI Sales Assistant:', error);
    res.status(500).json({ 
      success: false, 
      error: 'An error occurred processing your request',
      sessionId
    });
  }
});

// POST /api/assist/feedback - Endpoint to capture user feedback
router.post('/feedback', assistRateLimit, sessionMiddleware, async (req, res) => {
  const { messageId, vote, reason } = req.body;
  const sessionId = req.sessionId;
  
  try {
    // Store feedback in DB or analytics system
    // This is a minimal implementation - you may want to expand it
    console.log(`[AI Assistant Feedback] sessionId=${sessionId} messageId=${messageId} vote=${vote} reason=${reason || 'N/A'}`);
    
    res.json({
      success: true,
      message: 'Feedback received'
    });
  } catch (error) {
    console.error('Error saving feedback:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to save feedback' 
    });
  }
});

// GET /api/assist/suggestions - Optional endpoint for prefetching suggestions
router.get('/suggestions', assistRateLimit, sessionMiddleware, async (req, res) => {
  const { category, budget, brand } = req.query;
  const sessionId = req.sessionId;
  
  try {
    // Search for products based on query parameters
    const products = await ProductService.search({
      text: brand || '',
      budget: budget ? Number(budget) : null,
      category: category || null,
      limit: 5
    });
    
    res.json({
      success: true,
      sessionId,
      products
    });
  } catch (error) {
    console.error('Error getting product suggestions:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get product suggestions' 
    });
  }
});

export default router;
