export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('CartItems', {
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
    quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 1 },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });

  await queryInterface.addIndex('CartItems', ['user_id']);
  await queryInterface.addIndex('CartItems', ['product_id']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('CartItems');
}
