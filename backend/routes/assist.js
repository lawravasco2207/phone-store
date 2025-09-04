// Support chat and AI assistant routes
import express from 'express';
import { authRequired } from '../middleware/auth.js';
import SupportChatService from '../services/SupportChatService.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

/**
 * Start or continue a chat session
 * POST /api/support/chat/message
 */
router.post('/chat/message', authRequired, async (req, res) => {
  try {
    const { sessionId, message } = req.body || {};
    
    if (!message) {
      return res.status(400).json({ 
        success: false, 
        error: 'Message is required' 
      });
    }
    
    // Generate a session ID if not provided
    const chatSessionId = sessionId || uuidv4();
    
    // Process the message
    const response = await SupportChatService.processMessage(
      req.user.id,
      chatSessionId,
      message
    );
    
    return res.json({
      success: true,
      data: {
        sessionId: chatSessionId,
        response: response.response,
        category: response.category,
        solutions: response.solutions,
        duplicate: response.duplicate,
        shouldCreateTicket: response.shouldCreateTicket
      }
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to process message' 
    });
  }
});

/**
 * Create a ticket from chat
 * POST /api/support/chat/create-ticket
 */
router.post('/chat/create-ticket', authRequired, async (req, res) => {
  try {
    const { sessionId, subject, description } = req.body || {};
    
    if (!sessionId || !subject || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID, subject, and description are required' 
      });
    }
    
    // Create the ticket
    const result = await SupportChatService.createTicketFromChat(
      req.user.id,
      sessionId,
      subject,
      description
    );
    
    if (!result.success && result.duplicate) {
      return res.status(409).json({
        success: false,
        error: 'Similar ticket already exists',
        duplicateTicket: result.duplicateTicket
      });
    }
    
    return res.status(201).json({ 
      success: true, 
      data: { 
        id: result.ticket.id,
        category: result.ticket.category
      } 
    });
  } catch (error) {
    console.error('Error creating ticket from chat:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create ticket' 
    });
  }
});

/**
 * Get chat history
 * GET /api/support/chat/history/:sessionId
 */
router.get('/chat/history/:sessionId', authRequired, async (req, res) => {
  try {
    const { sessionId } = req.params;
    
    if (!sessionId) {
      return res.status(400).json({ 
        success: false, 
        error: 'Session ID is required' 
      });
    }
    
    const messages = await SupportChatService.getChatHistory(sessionId);
    
    return res.json({ 
      success: true, 
      data: messages 
    });
  } catch (error) {
    console.error('Error getting chat history:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get chat history' 
    });
  }
});

export default router;
