// Enhanced support ticket routes with AI-powered features
import express from 'express';
import { authRequired, adminRequired } from '../middleware/auth.js';
import SupportService from '../services/SupportService.js';
import AIService from '../services/AIService.js';
import db, { SupportTicket, TicketHistory } from '../models/index.js';
import rateLimit from 'express-rate-limit';

const router = express.Router();

// Rate limiting for ticket creation - max 10 tickets per hour per IP
const ticketCreationLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // limit each IP to 10 ticket creations per window
  message: 'Too many tickets created, please try again later',
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

/**
 * Create a new support ticket
 * POST /api/support/tickets
 */
router.post('/tickets', authRequired, ticketCreationLimiter, async (req, res) => {
  try {
    const { subject, description } = req.body || {};
    
    // Validate input
    if (!subject || !description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Subject and description are required' 
      });
    }
    
    // Sanitize input to prevent sensitive data
    const sanitizedDescription = sanitizeSensitiveData(description);
    
    // Create ticket
    const result = await SupportService.createTicket(req.user.id, { 
      subject, 
      description: sanitizedDescription 
    });
    
    // Handle duplicate tickets
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
    console.error('Error creating support ticket:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to create ticket' 
    });
  }
});

/**
 * Get all tickets for a user
 * GET /api/support/tickets/user/:userId
 */
router.get('/tickets/user/:userId', authRequired, async (req, res) => {
  try {
    const requestedUserId = parseInt(req.params.userId);
    
    // Users can only view their own tickets unless they're admins
    if (req.user.id !== requestedUserId && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized to view these tickets' 
      });
    }
    
    const tickets = await SupportService.getUserTickets(requestedUserId);
    
    return res.json({ 
      success: true, 
      data: tickets
    });
  } catch (error) {
    console.error('Error fetching user tickets:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch tickets' 
    });
  }
});

/**
 * Get a specific ticket by ID
 * GET /api/support/tickets/:id
 */
router.get('/tickets/:id', authRequired, async (req, res) => {
  try {
    const ticket = await SupportService.getTicketById(req.params.id);
    
    // Users can only view their own tickets unless they're admins
    if (ticket.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ 
        success: false, 
        error: 'Unauthorized to view this ticket' 
      });
    }
    
    return res.json({ 
      success: true, 
      data: ticket 
    });
  } catch (error) {
    console.error('Error fetching ticket details:', error);
    
    if (error.message === 'Ticket not found') {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to fetch ticket details' 
    });
  }
});

/**
 * Update a ticket's status
 * PATCH /api/support/tickets/:id
 */
router.patch('/tickets/:id', authRequired, async (req, res) => {
  try {
    const { status, note } = req.body || {};
    
    // Validate input
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        error: 'Status is required' 
      });
    }
    
    // Validate status value
    const validStatuses = ['open', 'in_progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ 
        success: false, 
        error: 'Invalid status value' 
      });
    }
    
    // Get the ticket to check permissions
    const ticket = await SupportTicket.findByPk(req.params.id);
    
    if (!ticket) {
      return res.status(404).json({ 
        success: false, 
        error: 'Ticket not found' 
      });
    }
    
    // Only admins can update status to anything
    // Regular users can only close their own tickets
    if (req.user.role !== 'admin') {
      if (ticket.user_id !== req.user.id) {
        return res.status(403).json({ 
          success: false, 
          error: 'Unauthorized to update this ticket' 
        });
      }
      
      if (status !== 'closed') {
        return res.status(403).json({ 
          success: false, 
          error: 'Users can only close their own tickets' 
        });
      }
    }
    
    // Update the ticket
    const updatedTicket = await SupportService.updateTicketStatus(
      req.params.id,
      status,
      note || '',
      req.user.id
    );
    
    return res.json({ 
      success: true, 
      data: updatedTicket 
    });
  } catch (error) {
    console.error('Error updating ticket status:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to update ticket status' 
    });
  }
});

/**
 * Get AI suggestions for a support issue
 * POST /api/support/suggestions
 */
router.post('/suggestions', authRequired, async (req, res) => {
  try {
    const { description } = req.body || {};
    
    if (!description) {
      return res.status(400).json({ 
        success: false, 
        error: 'Description is required' 
      });
    }
    
    const result = await SupportService.getSuggestedSolutions(description);
    
    return res.json({ 
      success: true, 
      data: result
    });
  } catch (error) {
    console.error('Error getting suggested solutions:', error);
    return res.status(500).json({ 
      success: false, 
      error: 'Failed to get suggested solutions' 
    });
  }
});

/**
 * Sanitize input to remove sensitive data
 * @param {string} text - Input text
 * @returns {string} - Sanitized text
 */
function sanitizeSensitiveData(text) {
  // Patterns for sensitive data
  const patterns = [
    // Credit card numbers
    /\b(?:\d[ -]*?){13,16}\b/g,
    // Common password patterns
    /\b(?:password|passwd|pwd)[ :=]+\S+\b/gi,
    // OTP codes
    /\b(?:otp|one[ -]?time[ -]?password|verification[ -]?code)[ :=]+\d{4,8}\b/gi,
    // CVV numbers
    /\b(?:cvv|cvc|security[ -]?code)[ :=]+\d{3,4}\b/gi,
    // API keys (common formats)
    /\b(?:api[_-]?key|access[_-]?token)[ :=]+[A-Za-z0-9_\-]{20,}\b/gi
  ];
  
  // Replace sensitive data with [REDACTED]
  let sanitized = text;
  for (const pattern of patterns) {
    sanitized = sanitized.replace(pattern, '[REDACTED]');
  }
  
  return sanitized;
}

export default router;
