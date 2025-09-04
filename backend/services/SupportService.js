// Support ticket service to handle ticket operations
import db from '../models/index.js';
  import { SupportTicket, TicketHistory, sequelize } from '../models/index.js';
import AIService from './AIService.js';
import MailService from './MailService.js';

class SupportService {
  /**
   * Create a new support ticket
   * @param {number} userId - User ID
   * @param {Object} ticketData - Ticket data (subject, description)
   * @returns {Promise<Object>} - Created ticket
   */
  async createTicket(userId, ticketData) {
    const { subject, description } = ticketData;
    const transaction = await sequelize.transaction();
    
    try {
      // Check for user
      const user = await db.User.findByPk(userId);
      if (!user) {
        throw new Error('User not found');
      }

      // Use AI to categorize the ticket
      const fullText = `${subject} ${description}`;
      const category = await AIService.classify(fullText);
      
      // Check for duplicate tickets
      const duplicate = await AIService.checkDuplicate(userId, fullText);
      
      if (duplicate) {
        await transaction.rollback();
        return { 
          success: false, 
          duplicate: true, 
          duplicateTicket: {
            id: duplicate.id,
            subject: duplicate.subject,
            status: duplicate.status,
            createdAt: duplicate.createdAt
          }
        };
      }
      
      // Create the ticket
      const ticket = await SupportTicket.create({
        user_id: userId,
        subject,
        description,
        category,
        status: 'open'
      }, { transaction });
      
      // Create initial history entry
      await TicketHistory.create({
        ticket_id: ticket.id,
        status: 'open',
        note: 'Ticket created',
        updated_by: userId,
        timestamp: new Date()
      }, { transaction });
      
      await transaction.commit();
      
      // Send email notification
      if (user.email) {
        await MailService.sendTicketCreated(user.email, ticket);
      }
      
      return { 
        success: true, 
        ticket 
      };
    } catch (error) {
      await transaction.rollback();
      console.error('Error creating support ticket:', error);
      throw error;
    }
  }

  /**
   * Get all tickets for a user
   * @param {number} userId - User ID
   * @returns {Promise<Array>} - User's tickets
   */
  async getUserTickets(userId) {
    try {
      const tickets = await SupportTicket.findAll({
        where: { user_id: userId },
        order: [['created_at', 'DESC']],
        include: [
          {
            model: TicketHistory,
            as: 'TicketHistories',
            attributes: ['status', 'note', 'timestamp'],
            order: [['timestamp', 'DESC']],
            limit: 1
          }
        ]
      });
      
      return tickets;
    } catch (error) {
      console.error('Error fetching user tickets:', error);
      throw error;
    }
  }

  /**
   * Get a specific ticket by ID
   * @param {string} ticketId - Ticket UUID
   * @returns {Promise<Object>} - Ticket with history
   */
  async getTicketById(ticketId) {
    try {
      const ticket = await SupportTicket.findByPk(ticketId, {
        include: [
          {
            model: db.User,
            attributes: ['id', 'name', 'email']
          },
          {
            model: TicketHistory,
            as: 'TicketHistories',
            order: [['timestamp', 'DESC']],
            include: [
              {
                model: db.User,
                as: 'updater',
                attributes: ['id', 'name']
              }
            ]
          }
        ]
      });
      
      if (!ticket) {
        throw new Error('Ticket not found');
      }
      
      return ticket;
    } catch (error) {
      console.error('Error fetching ticket details:', error);
      throw error;
    }
  }

  /**
   * Update a ticket's status and add a resolution note
   * @param {string} ticketId - Ticket UUID
   * @param {string} status - New status
   * @param {string} note - Resolution note
   * @param {number} updatedBy - User ID updating the ticket
   * @returns {Promise<Object>} - Updated ticket
   */
  async updateTicketStatus(ticketId, status, note, updatedBy) {
    const transaction = await sequelize.transaction();
    
    try {
      // Find the ticket
      const ticket = await SupportTicket.findByPk(ticketId, { transaction });
      
      if (!ticket) {
        await transaction.rollback();
        throw new Error('Ticket not found');
      }
      
      // Update the ticket status
      await ticket.update({ status }, { transaction });
      
      // Add to history
      await TicketHistory.create({
        ticket_id: ticketId,
        status,
        note,
        updated_by: updatedBy,
        timestamp: new Date()
      }, { transaction });
      
      await transaction.commit();
      
      // Get the updated ticket with user info for email
      const updatedTicket = await this.getTicketById(ticketId);
      const user = updatedTicket.User;
      
      // Send email notification
      if (user && user.email) {
        await MailService.sendTicketUpdated(user.email, updatedTicket, note);
      }
      
      return updatedTicket;
    } catch (error) {
      await transaction.rollback();
      console.error('Error updating ticket status:', error);
      throw error;
    }
  }

  /**
   * Get suggested solutions for a support issue
   * @param {string} text - Issue description
   * @returns {Promise<Object>} - Category and suggested solutions
   */
  async getSuggestedSolutions(text) {
    try {
      const category = await AIService.classify(text);
      const solutions = await AIService.getSuggestedSolutions(category, text);
      
      return {
        category,
        solutions
      };
    } catch (error) {
      console.error('Error getting suggested solutions:', error);
      throw error;
    }
  }
}

export default new SupportService();
