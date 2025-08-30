export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Orders', {
    id: {
      type: Sequelize.INTEGER,
      autoIncrement: true,
      primaryKey: true
    },
    user_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Users', key: 'id' },
      onDelete: 'CASCADE'
    },
    total_amount: {
      type: Sequelize.DECIMAL(10, 2),
      allowNull: false
    },
    currency: {
      type: Sequelize.STRING,
      allowNull: false,
      defaultValue: 'USD'
    },
    order_status: {
      type: Sequelize.ENUM('pending', 'paid', 'shipped', 'delivered', 'cancelled'),
      defaultValue: 'pending'
    },
    shipping_address: {
      type: Sequelize.TEXT
    },
    metadata: {
      type: Sequelize.JSONB
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

  // ✅ Add indexes for faster lookups
  await queryInterface.addIndex('Orders', ['user_id']);
  await queryInterface.addIndex('Orders', ['order_status']);
  await queryInterface.addIndex('Orders', ['createdAt']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Orders');
}
