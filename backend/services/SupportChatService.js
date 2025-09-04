// AI-powered chat service for the support system
import AIService from './AIService.js';
import SupportService from './SupportService.js';
import db from '../models/index.js';

class SupportChatService {
  /**
   * Process a user message and get AI response
   * @param {number} userId - User ID
   * @param {string} sessionId - Chat session ID
   * @param {string} message - User message
   * @returns {Promise<Object>} - AI response with suggested solutions
   */
  async processMessage(userId, sessionId, message) {
    try {
      // Store the message in the chat history
      await this.storeMessage(userId, sessionId, 'user', message);
      
      // Get category and suggested solutions
      const { category, solutions } = await SupportService.getSuggestedSolutions(message);
      
      // Check for duplicate tickets
      const duplicate = await AIService.checkDuplicate(userId, message);
      
      // Build the response
      let response = '';
      let shouldCreateTicket = false;
      
      if (duplicate) {
        response = `I found a similar support ticket that you already have open (ID: ${duplicate.id}, Subject: "${duplicate.subject}"). Would you like me to show you the status of that ticket instead of creating a new one?`;
      } else {
        response = `Based on your message, this appears to be a ${category} issue. Here are some solutions that might help:\n\n`;
        
        solutions.forEach((solution, index) => {
          response += `${index + 1}. ${solution}\n`;
        });
        
        response += `\nDid any of these solutions help resolve your issue? If not, I can create a support ticket for you.`;
        
        // If the message contains certain phrases, suggest creating a ticket
        const ticketPhrases = ['create ticket', 'submit ticket', 'open ticket', 'help me', 'need assistance', 'speak to support', 'talk to agent'];
        shouldCreateTicket = ticketPhrases.some(phrase => message.toLowerCase().includes(phrase));
      }
      
      // Store the AI response
      await this.storeMessage(userId, sessionId, 'assistant', response);
      
      return {
        category,
        solutions,
        response,
        duplicate: duplicate ? {
          id: duplicate.id,
          subject: duplicate.subject,
          status: duplicate.status
        } : null,
        shouldCreateTicket
      };
    } catch (error) {
      console.error('Error processing chat message:', error);
      throw error;
    }
  }

  /**
   * Store a message in the chat history
   * @param {number} userId - User ID
   * @param {string} sessionId - Chat session ID
   * @param {string} role - Message role (user/assistant)
   * @param {string} content - Message content
   * @returns {Promise<void>}
   */
  async storeMessage(userId, sessionId, role, content) {
    try {
      // Get or create the chat session
      let session = await db.ChatSession.findOne({
        where: { session_id: sessionId }
      });
      
      if (!session) {
        session = await db.ChatSession.create({
          session_id: sessionId,
          user_id: userId,
          status: 'active',
          metadata: { createdAt: new Date() }
        });
      }
      
      // Store the message
      await db.ChatMessage.create({
        session_id_fk: session.id,
        role,
        content
      });
    } catch (error) {
      console.error('Error storing chat message:', error);
      // Continue even if storage fails
    }
  }

  /**
   * Handle explicit ticket creation from chat
   * @param {number} userId - User ID
   * @param {string} sessionId - Chat session ID
   * @param {string} subject - Ticket subject
   * @param {string} description - Ticket description
   * @returns {Promise<Object>} - Created ticket or error
   */
  async createTicketFromChat(userId, sessionId, subject, description) {
    try {
      // Create the ticket
      const result = await SupportService.createTicket(userId, { subject, description });
      
      // Store the action in chat history
      let responseMessage = '';
      
      if (!result.success && result.duplicate) {
        responseMessage = `I found that you already have a similar open ticket (ID: ${result.duplicateTicket.id}). Let's use that one instead of creating a duplicate.`;
      } else {
        responseMessage = `I've created a support ticket for you! Your ticket ID is: ${result.ticket.id}. Our support team will review your issue and get back to you via email. You can also check the status of your ticket in your account.`;
      }
      
      await this.storeMessage(userId, sessionId, 'assistant', responseMessage);
      
      return result;
    } catch (error) {
      console.error('Error creating ticket from chat:', error);
      throw error;
    }
  }

  /**
   * Get chat history for a session
   * @param {string} sessionId - Chat session ID
   * @returns {Promise<Array>} - Chat messages
   */
  async getChatHistory(sessionId) {
    try {
      const session = await db.ChatSession.findOne({
        where: { session_id: sessionId },
        include: [
          {
            model: db.ChatMessage,
            order: [['createdAt', 'ASC']]
          }
        ]
      });
      
      if (!session) {
        return [];
      }
      
      return session.ChatMessages;
    } catch (error) {
      console.error('Error getting chat history:', error);
      return [];
    }
  }
}

export default new SupportChatService();
