// AI-powered service for categorizing tickets and detecting duplicates
import db from '../models/index.js';
import { Op } from 'sequelize';

class AIService {
  /**
   * Categorize a support ticket based on its content
   * @param {string} text - The subject and description of the ticket
   * @returns {Promise<string>} - Returns the category as a string
   */
  async classify(text) {
    try {
      // Keywords for each category
      const keywords = {
        Billing: ['payment', 'charge', 'refund', 'invoice', 'subscription', 'bill', 'price', 'discount', 'coupon', 'transaction', 'credit card', 'debit card', 'paypal', 'mpesa'],
        Technical: ['bug', 'error', 'crash', 'not working', 'broken', 'feature', 'issue', 'problem', 'glitch', 'login', 'password', 'reset', 'device', 'app', 'website', 'connection'],
        Account: ['account', 'profile', 'login', 'password', 'email', 'change', 'update', 'delete', 'username', 'registration', 'sign up', 'sign in', 'reset password', 'verification']
      };

      const lowerText = text.toLowerCase();
      
      // Count keyword matches for each category
      const scores = Object.entries(keywords).reduce((acc, [category, words]) => {
        const matchCount = words.filter(word => lowerText.includes(word.toLowerCase())).length;
        acc[category] = matchCount;
        return acc;
      }, {});

      // Find the category with the highest score
      const entries = Object.entries(scores);
      const maxScore = Math.max(...entries.map(([_, score]) => score));
      
      // If we have matches, return the highest scoring category
      if (maxScore > 0) {
        const topCategory = entries.find(([_, score]) => score === maxScore)[0];
        return topCategory;
      }
      
      // Default to 'Other' if no keywords match
      return 'Other';
    } catch (error) {
      console.error('Error in AI classification:', error);
      return 'Other'; // Default fallback category
    }
  }

  /**
   * Check for similar existing open tickets for the user
   * @param {number} userId - The user ID
   * @param {string} text - The subject and description of the new ticket
   * @returns {Promise<Object|null>} - Returns the duplicate ticket if found, null otherwise
   */
  async checkDuplicate(userId, text) {
    try {
      // Get all open tickets for this user
      const userTickets = await db.SupportTicket.findAll({
        where: {
          user_id: userId,
          status: {
            [Op.in]: ['open', 'in_progress']
          }
        }
      });

      if (!userTickets || userTickets.length === 0) {
        return null;
      }

      // Convert text to lowercase for comparison
      const lowerText = text.toLowerCase();
      
      // Extract key phrases (could be enhanced with NLP in production)
      const keyPhrases = this.extractKeyPhrases(lowerText);
      
      // Look for similar tickets
      for (const ticket of userTickets) {
        const ticketText = `${ticket.subject} ${ticket.description}`.toLowerCase();
        
        // Check for key phrase matches
        const matchCount = keyPhrases.filter(phrase => ticketText.includes(phrase)).length;
        
        // If we have a significant match (30% or more of key phrases)
        if (matchCount > 0 && (matchCount / keyPhrases.length) >= 0.3) {
          return ticket;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error checking for duplicate tickets:', error);
      return null;
    }
  }

  /**
   * Extract key phrases from text for similarity matching
   * @param {string} text - The text to analyze
   * @returns {string[]} - Array of key phrases
   */
  extractKeyPhrases(text) {
    // Remove common words, keep only significant terms
    const stopWords = new Set(['i', 'me', 'my', 'myself', 'we', 'our', 'ours', 'ourselves', 'you', 'your', 'yours', 
      'yourself', 'yourselves', 'he', 'him', 'his', 'himself', 'she', 'her', 'hers', 'herself', 
      'it', 'its', 'itself', 'they', 'them', 'their', 'theirs', 'themselves', 'what', 'which', 
      'who', 'whom', 'this', 'that', 'these', 'those', 'am', 'is', 'are', 'was', 'were', 'be', 
      'been', 'being', 'have', 'has', 'had', 'having', 'do', 'does', 'did', 'doing', 'a', 'an', 
      'the', 'and', 'but', 'if', 'or', 'because', 'as', 'until', 'while', 'of', 'at', 'by', 'for', 
      'with', 'about', 'against', 'between', 'into', 'through', 'during', 'before', 'after', 'above', 
      'below', 'to', 'from', 'up', 'down', 'in', 'out', 'on', 'off', 'over', 'under', 'again', 'further', 
      'then', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 
      'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only', 'own', 'same', 'so', 'than', 
      'too', 'very', 's', 't', 'can', 'will', 'just', 'don', 'should', 'now']);
    
    // Split text into words and filter out stop words
    const words = text.split(/\W+/).filter(word => word.length > 2 && !stopWords.has(word.toLowerCase()));
    
    // Create phrases from consecutive words (bigrams)
    const phrases = [];
    for (let i = 0; i < words.length - 1; i++) {
      phrases.push(`${words[i]} ${words[i + 1]}`);
    }
    
    // Add important single words as well
    const significantWords = words.filter(w => w.length > 5);
    
    return [...new Set([...phrases, ...significantWords])];
  }

  /**
   * Get common solutions for a ticket based on its category and content
   * @param {string} category - The ticket category
   * @param {string} text - The ticket subject and description
   * @returns {string[]} - Array of potential solutions
   */
  async getSuggestedSolutions(category, text) {
    const lowerText = text.toLowerCase();
    
    // Common solutions by category
    const solutions = {
      Billing: [
        "Check your payment method details in your account settings.",
        "Verify your latest invoice in the billing section.",
        "Contact your bank to ensure the transaction is not being blocked.",
        "Check your email for payment confirmation or failure notifications.",
        "Try using a different payment method from your account settings."
      ],
      Technical: [
        "Try restarting your device and the application.",
        "Clear your browser cache and cookies.",
        "Update to the latest version of the application.",
        "Check your internet connection and try again.",
        "Verify that your system meets the minimum requirements."
      ],
      Account: [
        "Try resetting your password through the 'Forgot Password' link.",
        "Check if your email address is verified in account settings.",
        "Make sure you're using the correct email address to log in.",
        "Check for any account notifications or alerts in your profile.",
        "If locked out, wait 30 minutes before trying again."
      ],
      Other: [
        "Check our FAQ section for common questions and answers.",
        "Review the product documentation for detailed information.",
        "Try searching for your issue in our knowledge base.",
        "Check if there are any ongoing service disruptions in the status page."
      ]
    };
    
    // Return relevant solutions based on category
    return solutions[category] || solutions.Other;
  }
}

export default new AIService();
