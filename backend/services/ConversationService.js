// Conversation service for handling chat memory
import db from '../models/index.js';
import { v4 as uuidv4 } from 'uuid';

/**
 * Service to manage conversation memory for the AI Sales Assistant
 */
class ConversationService {
  /**
   * Get conversation memory for a given session
   * @param {string} sessionId - The unique session identifier
   * @param {number|null} userId - Optional user ID for authenticated users
   * @returns {Promise<Object>} The conversation memory including history and preferences
   */
  async getMemory(sessionId) {
    try {
      // Find or create a chat session
      let chatSession = await db.ChatSession.findOne({
        where: { session_id: sessionId }
      });

      if (!chatSession) {
        return { history: [], prefs: {} };
      }

      // Get messages for this session, ordered by creation time
      const messages = await db.ChatMessage.findAll({
        where: { session_id_fk: chatSession.id },
        order: [['createdAt', 'ASC']],
        limit: 20 // Limit to the last 20 messages to control token usage
      });

      // Format messages for the LLM
      const history = messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      // Extract preferences from session metadata
      const prefs = chatSession.metadata || {};

      return { history, prefs };
    } catch (error) {
      console.error('Error getting conversation memory:', error);
      return { history: [], prefs: {} };
    }
  }

  /**
   * Update conversation memory with new preferences
   * @param {string} sessionId - The unique session identifier
   * @param {Object} patch - The preference updates to apply
   * @returns {Promise<boolean>} Success status
   */
  async updateMemory(sessionId, patch = {}) {
    try {
      // Find the chat session
      let chatSession = await db.ChatSession.findOne({
        where: { session_id: sessionId }
      });

      // Create session if it doesn't exist
      if (!chatSession) {
        chatSession = await db.ChatSession.create({
          session_id: sessionId,
          status: 'active',
          metadata: patch
        });
        return true;
      }

      // Merge new preferences with existing metadata
      const updatedMetadata = {
        ...(chatSession.metadata || {}),
        ...patch
      };

      // Update the session metadata
      await chatSession.update({ metadata: updatedMetadata });
      return true;
    } catch (error) {
      console.error('Error updating conversation memory:', error);
      return false;
    }
  }

  /**
   * Add a new message to the conversation history
   * @param {string} sessionId - The unique session identifier
   * @param {string} role - Message role (user/assistant/system)
   * @param {string} content - Message content
   * @param {Object|null} userId - Optional user ID for authenticated users
   * @returns {Promise<Object|null>} The created message or null if failed
   */
  async addMessage(sessionId, role, content, userId = null) {
    try {
      // Find or create chat session
      let chatSession = await db.ChatSession.findOne({
        where: { session_id: sessionId }
      });

      if (!chatSession) {
        chatSession = await db.ChatSession.create({
          session_id: sessionId,
          user_id: userId,
          status: 'active',
          metadata: {}
        });
      }

      // Create the message
      const message = await db.ChatMessage.create({
        session_id_fk: chatSession.id,
        role,
        content
      });

      return message;
    } catch (error) {
      console.error('Error adding message to conversation:', error);
      return null;
    }
  }

  /**
   * Generate a new session ID
   * @returns {string} A new UUID v4 session ID
   */
  generateSessionId() {
    return uuidv4();
  }
}

export default new ConversationService();
