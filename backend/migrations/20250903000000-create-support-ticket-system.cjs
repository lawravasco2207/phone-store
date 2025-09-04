'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Drop existing SupportTicket table if it exists
    await queryInterface.dropTable('SupportTickets', { cascade: true }).catch(() => {
      console.log('SupportTickets table does not exist, continuing...');
    });

    // Create enhanced SupportTicket table
    await queryInterface.createTable('SupportTickets', {
      id: {
        type: Sequelize.UUID,
        defaultValue: Sequelize.UUIDV4,
        primaryKey: true
      },
      userId: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'Users',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'user_id'
      },
      subject: {
        type: Sequelize.STRING,
        allowNull: false
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      category: {
        type: Sequelize.ENUM('Billing', 'Technical', 'Account', 'Other'),
        allowNull: false,
        defaultValue: 'Other'
      },
      status: {
        type: Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'),
        allowNull: false,
        defaultValue: 'open'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'created_at'
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false,
        field: 'updated_at'
      }
    });

    // Create TicketHistory table
    await queryInterface.createTable('TicketHistories', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      ticketId: {
        type: Sequelize.UUID,
        allowNull: false,
        references: {
          model: 'SupportTickets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        field: 'ticket_id'
      },
      status: {
        type: Sequelize.ENUM('open', 'in_progress', 'resolved', 'closed'),
        allowNull: false
      },
      note: {
        type: Sequelize.TEXT,
        allowNull: true
      },
      updatedBy: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'Users',
          key: 'id'
        },
        field: 'updated_by'
      },
      timestamp: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW')
      }
    });

    // Create index on ticketId for faster lookups
    await queryInterface.addIndex('TicketHistories', ['ticket_id']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('TicketHistories');
    await queryInterface.dropTable('SupportTickets');
  }
};
