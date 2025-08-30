export async function up(queryInterface, Sequelize) {
  // ===== Categories =====
  await queryInterface.createTable('Categories', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: false, unique: true },
    description: { type: Sequelize.TEXT },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });

  // ===== ProductCategories (many-to-many) =====
  await queryInterface.createTable('ProductCategories', {
    product_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Products', key: 'id' },
      onDelete: 'CASCADE'
    },
    category_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Categories', key: 'id' },
      onDelete: 'CASCADE'
    }
  });
  await queryInterface.addIndex('ProductCategories', ['product_id']);
  await queryInterface.addIndex('ProductCategories', ['category_id']);

  // ===== Reviews =====
  await queryInterface.createTable('Reviews', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    product_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Products', key: 'id' },
      onDelete: 'CASCADE'
    },
    rating: { type: Sequelize.INTEGER, allowNull: false }, // 1-5 stars
    comment: { type: Sequelize.TEXT },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
  await queryInterface.addIndex('Reviews', ['product_id']);
  await queryInterface.addIndex('Reviews', ['user_id']);

  // ===== Inventory =====
  await queryInterface.createTable('Inventory', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    product_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Products', key: 'id' },
      onDelete: 'CASCADE'
    },
    stock_quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
    restock_date: { type: Sequelize.DATE },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
  await queryInterface.addIndex('Inventory', ['product_id']);

  // ===== SupportTickets =====
  await queryInterface.createTable('SupportTickets', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    subject: { type: Sequelize.STRING, allowNull: false },
    message: { type: Sequelize.TEXT, allowNull: false },
    status: { type: Sequelize.ENUM('open', 'in_progress', 'closed'), defaultValue: 'open' },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
  await queryInterface.addIndex('SupportTickets', ['user_id']);
  await queryInterface.addIndex('SupportTickets', ['status']);

  // ===== AuditLogs =====
  await queryInterface.createTable('AuditLogs', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Users', key: 'id' },
      onDelete: 'SET NULL'
    },
    action: { type: Sequelize.STRING, allowNull: false },
    table_name: { type: Sequelize.STRING },
    record_id: { type: Sequelize.INTEGER },
    changes: { type: Sequelize.JSONB },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
  await queryInterface.addIndex('AuditLogs', ['user_id']);
  await queryInterface.addIndex('AuditLogs', ['table_name']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('AuditLogs');
  await queryInterface.dropTable('SupportTickets');
  await queryInterface.dropTable('Inventory');
  await queryInterface.dropTable('Reviews');
  await queryInterface.dropTable('ProductCategories');
  await queryInterface.dropTable('Categories');
}
