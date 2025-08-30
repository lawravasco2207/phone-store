export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('OrderItems', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    order_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Orders', key: 'id' },
      onDelete: 'CASCADE'
    },
    product_id: {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: { model: 'Products', key: 'id' },
      onDelete: 'CASCADE'
    },
    quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
    price_at_purchase: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });

  await queryInterface.addIndex('OrderItems', ['order_id']);
  await queryInterface.addIndex('OrderItems', ['product_id']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('OrderItems');
}
