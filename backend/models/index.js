// Central Sequelize setup and lightweight model definitions matching migrations.
// Keep models minimal; business logic stays in routes/services.

import 'dotenv/config';
import { Sequelize, DataTypes } from 'sequelize';

const DATABASE_URL = process.env.DATABASE_URL;
if (!DATABASE_URL) {
  // Avoid throwing at import time in tests; app startup will fail loudly.
  console.warn('DATABASE_URL not set. Configure it in .env');
}

function buildSequelize() {
  // In tests, always use fast in-memory SQLite regardless of env
  if (process.env.NODE_ENV === 'test' || process.env.VITEST) {
    return new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  }
  if (!DATABASE_URL) {
    return new Sequelize({ dialect: 'sqlite', storage: ':memory:', logging: false });
  }
  const isLocal = /localhost|127\.0\.0\.1/.test(DATABASE_URL);
  const forceSSL = process.env.DB_SSL === 'require' || process.env.PGSSLMODE === 'require';
  const dialectOptions = (!isLocal || forceSSL)
    ? { ssl: { require: true, rejectUnauthorized: false } }
    : undefined;
  return new Sequelize(DATABASE_URL, { dialect: 'postgres', logging: false, dialectOptions });
}

export const sequelize = buildSequelize();

// ===== Models (fields mirror migrations; optional fields omitted for brevity) =====
export const User = sequelize.define('User', {
  name: { type: DataTypes.STRING, allowNull: false },
  email: { type: DataTypes.STRING, allowNull: false, unique: true },
  passwordHash: { type: DataTypes.STRING, allowNull: false },
  phone: DataTypes.STRING,
  address: DataTypes.TEXT,
  preferences: DataTypes.JSONB,
  lastLogin: DataTypes.DATE,
  role: { type: DataTypes.ENUM('user', 'admin', 'seller', 'viewer'), allowNull: false, defaultValue: 'user' },
  emailVerified: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
});

export const Product = sequelize.define('Product', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: { type: DataTypes.STRING, allowNull: false },
  category: DataTypes.STRING,
  price: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  description: { type: DataTypes.TEXT },
  images: { type: DataTypes.JSONB, allowNull: true }, // array of URLs
  slug: { type: DataTypes.STRING, unique: true },
  brand: DataTypes.STRING,
  attributes: DataTypes.JSONB,
  external_id: { type: DataTypes.STRING, unique: true },
});

export const Order = sequelize.define('Order', {
  total_amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
  order_status: { type: DataTypes.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'), defaultValue: 'pending' },
  shipping_address: DataTypes.TEXT,
  metadata: DataTypes.JSONB,
});

export const Payment = sequelize.define('Payment', {
  amount: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
  currency: { type: DataTypes.STRING, allowNull: false },
  payment_method: { type: DataTypes.ENUM('paypal', 'mpesa', 'stripe', 'mock'), allowNull: false },
  payment_status: { type: DataTypes.ENUM('pending', 'completed', 'failed', 'refunded'), defaultValue: 'pending' },
  transaction_id: { type: DataTypes.STRING, allowNull: false },
  metadata: DataTypes.JSONB,
});

export const OrderItem = sequelize.define('OrderItem', {
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  price_at_purchase: { type: DataTypes.DECIMAL(10, 2), allowNull: false },
});

export const CartItem = sequelize.define('CartItem', {
  quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
});

export const Category = sequelize.define('Category', {
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: DataTypes.TEXT,
});

export const ProductCategory = sequelize.define('ProductCategory', {}, { timestamps: false });

export const Review = sequelize.define('Review', {
  rating: { type: DataTypes.INTEGER, allowNull: false },
  comment: DataTypes.TEXT,
});

export const Inventory = sequelize.define('Inventory', {
  stock_quantity: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  restock_date: DataTypes.DATE,
}, {
  tableName: 'Inventories'  // Explicitly set the table name to match Sequelize's default pluralization
});

// Enhanced SupportTicket model (UUID id, description, category, expanded statuses)
export const SupportTicket = sequelize.define('SupportTicket', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true,
  },
  subject: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT, allowNull: false },
  category: { type: DataTypes.ENUM('Billing', 'Technical', 'Account', 'Other'), allowNull: false, defaultValue: 'Other' },
  status: { type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'), allowNull: false, defaultValue: 'open' },
}, {
  tableName: 'SupportTickets',
  underscored: true,
});

// TicketHistory model for status changes
export const TicketHistory = sequelize.define('TicketHistory', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  ticket_id: { type: DataTypes.UUID, allowNull: false },
  status: { type: DataTypes.ENUM('open', 'in_progress', 'resolved', 'closed'), allowNull: false },
  note: { type: DataTypes.TEXT },
  updated_by: { type: DataTypes.INTEGER },
  timestamp: { type: DataTypes.DATE, allowNull: false, defaultValue: Sequelize.fn('NOW') },
}, {
  tableName: 'TicketHistories',
  timestamps: false,
});

export const AuditLog = sequelize.define('AuditLog', {
  action: { type: DataTypes.STRING, allowNull: false },
  table_name: DataTypes.STRING,
  record_id: DataTypes.INTEGER,
  changes: DataTypes.JSONB,
});

export const VerificationToken = sequelize.define('VerificationToken', {
  token: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.ENUM('email_verify'), allowNull: false },
  expiresAt: { type: DataTypes.DATE, allowNull: false },
});

// Chat session and messages for persistent AI memory
export const ChatSession = sequelize.define('ChatSession', {
  session_id: { type: DataTypes.STRING, allowNull: false, unique: true },
  status: { type: DataTypes.ENUM('active', 'archived'), allowNull: false, defaultValue: 'active' },
  metadata: { type: DataTypes.JSONB },
});

export const ChatMessage = sequelize.define('ChatMessage', {
  role: { type: DataTypes.ENUM('system', 'user', 'assistant', 'tool'), allowNull: false },
  content: { type: DataTypes.TEXT, allowNull: false },
  tool_calls: { type: DataTypes.JSONB },
});

// ===== Associations (kept compact and explicit) =====
User.hasMany(Order, { foreignKey: 'user_id' });
Order.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(Payment, { foreignKey: 'user_id' });
Payment.belongsTo(User, { foreignKey: 'user_id' });
Order.hasMany(Payment, { foreignKey: 'order_id' });
Payment.belongsTo(Order, { foreignKey: 'order_id' });

Order.hasMany(OrderItem, { foreignKey: 'order_id' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });
Product.hasMany(OrderItem, { foreignKey: 'product_id' });
OrderItem.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(CartItem, { foreignKey: 'user_id' });
CartItem.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(CartItem, { foreignKey: 'product_id' });
CartItem.belongsTo(Product, { foreignKey: 'product_id' });

Product.belongsToMany(Category, { through: ProductCategory, foreignKey: 'product_id' });
Category.belongsToMany(Product, { through: ProductCategory, foreignKey: 'category_id' });

User.hasMany(Review, { foreignKey: 'user_id' });
Review.belongsTo(User, { foreignKey: 'user_id' });
Product.hasMany(Review, { foreignKey: 'product_id' });
Review.belongsTo(Product, { foreignKey: 'product_id' });

Product.hasOne(Inventory, { foreignKey: 'product_id' });
Inventory.belongsTo(Product, { foreignKey: 'product_id' });

User.hasMany(SupportTicket, { foreignKey: 'user_id' });
SupportTicket.belongsTo(User, { foreignKey: 'user_id' });

// Support ticket history associations
SupportTicket.hasMany(TicketHistory, { foreignKey: 'ticket_id', as: 'TicketHistories' });
TicketHistory.belongsTo(SupportTicket, { foreignKey: 'ticket_id' });
TicketHistory.belongsTo(User, { foreignKey: 'updated_by', as: 'updater' });

User.hasMany(AuditLog, { foreignKey: 'user_id' });
AuditLog.belongsTo(User, { foreignKey: 'user_id' });

User.hasMany(VerificationToken, { foreignKey: 'user_id' });
VerificationToken.belongsTo(User, { foreignKey: 'user_id' });

// Chat associations
User.hasMany(ChatSession, { foreignKey: 'user_id' });
ChatSession.belongsTo(User, { foreignKey: 'user_id' });
ChatSession.hasMany(ChatMessage, { foreignKey: 'session_id_fk', onDelete: 'CASCADE' });
ChatMessage.belongsTo(ChatSession, { foreignKey: 'session_id_fk' });

// ===== New models for product ingestion =====
export const ProductVariant = sequelize.define('ProductVariant', {
  sku: { type: DataTypes.STRING, unique: true },
  barcode: { type: DataTypes.STRING, unique: true },
  options: DataTypes.JSONB,
  price_cents: { type: DataTypes.INTEGER, allowNull: false },
  compare_at_price_cents: DataTypes.INTEGER,
  currency: { type: DataTypes.STRING, allowNull: false, defaultValue: 'USD' },
  weight_grams: DataTypes.INTEGER,
  dimensions: DataTypes.JSONB,
});

export const Seller = sequelize.define('Seller', {
  name: { type: DataTypes.STRING, allowNull: false },
  contact_email: { type: DataTypes.STRING, allowNull: false },
  api_key: { type: DataTypes.STRING, unique: true },
  webhook_url: DataTypes.STRING,
  status: { type: DataTypes.ENUM('active', 'inactive', 'pending'), allowNull: false, defaultValue: 'active' },
});

export const Offer = sequelize.define('Offer', {
  status: { type: DataTypes.ENUM('draft', 'active', 'inactive'), allowNull: false, defaultValue: 'draft' },
});

export const IngestionJob = sequelize.define('IngestionJob', {
  type: { type: DataTypes.ENUM('manual', 'csv', 'api'), allowNull: false },
  status: { type: DataTypes.ENUM('queued', 'processing', 'done', 'failed'), allowNull: false, defaultValue: 'queued' },
  stats: DataTypes.JSONB,
  file_path: DataTypes.STRING,
  options: DataTypes.JSONB,
});

export const IngestionEvent = sequelize.define('IngestionEvent', {
  level: { type: DataTypes.ENUM('info', 'warn', 'error'), allowNull: false, defaultValue: 'info' },
  code: DataTypes.STRING,
  message: { type: DataTypes.TEXT, allowNull: false },
  payload: DataTypes.JSONB,
  createdAt: { type: DataTypes.DATE, allowNull: false },
}, { timestamps: false });

export const MediaAsset = sequelize.define('MediaAsset', {
  url: { type: DataTypes.STRING, allowNull: false },
  purpose: { type: DataTypes.ENUM('main', 'gallery'), allowNull: false, defaultValue: 'gallery' },
  meta: DataTypes.JSONB,
});

// ===== New associations for product ingestion =====
Product.hasMany(ProductVariant, { foreignKey: 'product_id' });
ProductVariant.belongsTo(Product, { foreignKey: 'product_id' });

ProductVariant.hasOne(Inventory, { foreignKey: 'variant_id' });
Inventory.belongsTo(ProductVariant, { foreignKey: 'variant_id' });

Product.hasMany(Offer, { foreignKey: 'product_id' });
Offer.belongsTo(Product, { foreignKey: 'product_id' });

Seller.hasMany(Offer, { foreignKey: 'seller_id' });
Offer.belongsTo(Seller, { foreignKey: 'seller_id' });

Seller.hasMany(IngestionJob, { foreignKey: 'seller_id' });
IngestionJob.belongsTo(Seller, { foreignKey: 'seller_id' });

IngestionJob.hasMany(IngestionEvent, { foreignKey: 'job_id' });
IngestionEvent.belongsTo(IngestionJob, { foreignKey: 'job_id' });

Product.hasMany(MediaAsset, { foreignKey: 'product_id' });
MediaAsset.belongsTo(Product, { foreignKey: 'product_id' });

ProductVariant.hasMany(MediaAsset, { foreignKey: 'variant_id' });
MediaAsset.belongsTo(ProductVariant, { foreignKey: 'variant_id' });

// Export a simple db object for ergonomic imports around the app.
const db = {
  sequelize,
  Sequelize,
  User,
  Users: User, // alias to avoid breaking older imports
  Product,
  Products: Product,
  Order,
  Orders: Order,
  Payment,
  Payments: Payment,
  OrderItem,
  OrderItems: OrderItem,
  CartItem,
  CartItems: CartItem,
  Category,
  ProductCategory,
  Review,
  Inventory,
  SupportTicket,
  AuditLog,
  VerificationToken,
  TicketHistory,
  ChatSession,
  ChatMessage,
  // New models
  ProductVariant,
  Seller,
  Offer,
  IngestionJob,
  IngestionEvent,
  MediaAsset,
};

export default db;
