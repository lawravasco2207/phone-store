export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Payments', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE',
    },
    order_id: {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'Orders', key: 'id' },
      onDelete: 'SET NULL'
    },
    amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING,
      allowNull: false
    },
    payment_method: {
      type: Sequelize.ENUM('paypal', 'mpesa', 'stripe'),
      allowNull: false
    },
    payment_status: {
      type: Sequelize.ENUM('pending', 'completed', 'failed', 'refunded'),
      defaultValue: 'pending'
    },
    transaction_id: {
      type: Sequelize.STRING,
      allowNull: false
    },
    metadata: {
      type: Sequelize.JSONB,
    },
    createdAt: {
      type: Sequelize.DATE,
      allowNull: false
    },
    updatedAt: {
      type: Sequelize.DATE,
      allowNull: false
    }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Payments');
}