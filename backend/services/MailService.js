// Email notification service for support tickets
import nodemailer from 'nodemailer';
import 'dotenv/config';

class MailService {
  constructor() {
    this.transporter = null;
    this.initialize();
  }

  /**
   * Initialize the email transporter
   */
  initialize() {
    try {
      // Check for required environment variables
      const { EMAIL_USER, EMAIL_PASS, EMAIL_HOST, EMAIL_PORT } = process.env;
      
      if (!EMAIL_USER || !EMAIL_PASS) {
        console.warn('Email service not configured. Set EMAIL_USER and EMAIL_PASS in .env');
        return;
      }

      // Create transporter with Gmail SMTP or custom SMTP
      this.transporter = nodemailer.createTransport({
        host: EMAIL_HOST || 'smtp.gmail.com',
        port: EMAIL_PORT || 587,
        secure: false, // true for 465, false for other ports
        auth: {
          user: EMAIL_USER,
          pass: EMAIL_PASS,
        },
      });

      // Verify connection configuration
      this.transporter.verify((error) => {
        if (error) {
          console.error('Failed to initialize email service:', error);
        } else {
          console.log('Email service initialized successfully');
        }
      });
    } catch (error) {
      console.error('Error initializing email service:', error);
    }
  }

  /**
   * Send an email
   * @param {Object} options - Email options (to, subject, html)
   * @returns {Promise<boolean>} - Success status
   */
  async sendEmail(options) {
    try {
      if (!this.transporter) {
        console.warn('Email service not initialized');
        return false;
      }

      const { to, subject, html } = options;
      
      if (!to || !subject || !html) {
        console.error('Missing required email parameters');
        return false;
      }

      // Send mail with defined transport object
      await this.transporter.sendMail({
        from: `"Phone Store Support" <${process.env.EMAIL_USER}>`,
        to,
        subject,
        html,
      });

      return true;
    } catch (error) {
      console.error('Error sending email:', error);
      return false;
    }
  }

  /**
   * Send ticket creation confirmation email
   * @param {string} to - Recipient email address
   * @param {Object} ticket - Ticket data
   * @returns {Promise<boolean>} - Success status
   */
  async sendTicketCreated(to, ticket) {
    const subject = `Support Ticket Created: #${ticket.id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Support Ticket Created</h2>
        <p>Dear Customer,</p>
        <p>Your support ticket has been created successfully. Here are the details:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Category:</strong> ${ticket.category}</p>
          <p><strong>Status:</strong> ${ticket.status}</p>
          <p><strong>Created:</strong> ${new Date(ticket.createdAt).toLocaleString()}</p>
        </div>
        
        <p>Our support team will review your ticket and get back to you as soon as possible.</p>
        <p>Thank you for your patience.</p>
        
        <p style="margin-top: 30px;">Best regards,<br>Phone Store Support Team</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }

  /**
   * Send ticket status update email
   * @param {string} to - Recipient email address
   * @param {Object} ticket - Ticket data
   * @param {string} resolutionNote - Optional resolution note
   * @returns {Promise<boolean>} - Success status
   */
  async sendTicketUpdated(to, ticket, resolutionNote) {
    const statusColors = {
      'open': '#3498db',
      'in_progress': '#f39c12',
      'resolved': '#2ecc71',
      'closed': '#95a5a6'
    };

    const subject = `Support Ticket Updated: #${ticket.id}`;
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #333;">Support Ticket Updated</h2>
        <p>Dear Customer,</p>
        <p>Your support ticket has been updated. Here are the latest details:</p>
        
        <div style="background-color: #f5f5f5; padding: 15px; border-radius: 5px; margin: 20px 0;">
          <p><strong>Ticket ID:</strong> ${ticket.id}</p>
          <p><strong>Subject:</strong> ${ticket.subject}</p>
          <p><strong>Category:</strong> ${ticket.category}</p>
          <p>
            <strong>Status:</strong> 
            <span style="color: ${statusColors[ticket.status] || '#333'}; font-weight: bold;">
              ${ticket.status.charAt(0).toUpperCase() + ticket.status.slice(1)}
            </span>
          </p>
          <p><strong>Updated:</strong> ${new Date(ticket.updatedAt).toLocaleString()}</p>
          
          ${resolutionNote ? `
            <div style="margin-top: 15px; padding: 10px; background-color: #e8f4fc; border-left: 4px solid #3498db; border-radius: 3px;">
              <p><strong>Resolution Note:</strong></p>
              <p>${resolutionNote}</p>
            </div>
          ` : ''}
        </div>
        
        ${ticket.status === 'resolved' || ticket.status === 'closed' ? `
          <p>Thank you for contacting our support team. We hope your issue has been resolved to your satisfaction.</p>
          <p>If you have any further questions or concerns, please don't hesitate to contact us again.</p>
        ` : `
          <p>Our support team is actively working on your ticket.</p>
          <p>We'll keep you updated on any progress.</p>
        `}
        
        <p style="margin-top: 30px;">Best regards,<br>Phone Store Support Team</p>
      </div>
    `;

    return this.sendEmail({ to, subject, html });
  }
}

export default new MailService();
