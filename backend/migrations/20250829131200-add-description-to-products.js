export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Products', 'description', { type: Sequelize.TEXT, allowNull: true });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Products', 'description');
}
