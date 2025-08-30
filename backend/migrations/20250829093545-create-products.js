export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Products', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: false },
    category: { type: Sequelize.STRING},
    price: { type: Sequelize.DECIMAL(10, 2), allowNull: false },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false }
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Products');
}