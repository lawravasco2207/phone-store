// Update model definitions for enhanced SupportTicket and TicketHistory models
import { sequelize, User } from './index.js';
import { Sequelize, DataTypes } from 'sequelize';

// Update SupportTicket model
export const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  subject: { 
    type: DataTypes.STRING, 
    allowNull: false 
  },
  description: { 
    type: DataTypes.TEXT, 
    allowNull: false,
    field: 'description'
  },
  category: { 
    type: DataTypes.ENUM('Billing', 'Technical', 'Account', 'Other'), 
    allowNull: false,
    defaultValue: 'Other'
  },
  status: { 
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'), 
    allowNull: false,
    defaultValue: 'open'
  }
}, {
  tableName: 'SupportTickets',
  underscored: true, // Use snake_case for column names
});

// Create TicketHistory model
export const TicketHistory = sequelize.define('TicketHistory', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  ticketId: {
    type: DataTypes.UUID,
    allowNull: false,
    field: 'ticket_id'
  },
  status: {
    type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'),
    allowNull: false
  },
  note: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  updatedBy: {
    type: DataTypes.INTEGER,
    allowNull: true,
    field: 'updated_by'
  },
  timestamp: {
    type: DataTypes.DATE,
    allowNull: false,
    defaultValue: Sequelize.fn('NOW')
  }
}, {
  tableName: 'TicketHistories',
  timestamps: false,
});

// Associations
SupportTicket.belongsTo(User, { foreignKey: 'user_id' });
User.hasMany(SupportTicket, { foreignKey: 'user_id' });

SupportTicket.hasMany(TicketHistory, { foreignKey: 'ticket_id' });
TicketHistory.belongsTo(SupportTicket, { foreignKey: 'ticket_id' });

TicketHistory.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

export default {
  SupportTicket,
  TicketHistory
};
