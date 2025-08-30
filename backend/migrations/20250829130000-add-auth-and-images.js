export async function up(queryInterface, Sequelize) {
  await queryInterface.addColumn('Users', 'role', { type: Sequelize.ENUM('user', 'admin'), allowNull: false, defaultValue: 'user' });
  await queryInterface.addColumn('Users', 'emailVerified', { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false });
  await queryInterface.addColumn('Products', 'images', { type: Sequelize.JSONB, allowNull: true });
}

export async function down(queryInterface) {
  await queryInterface.removeColumn('Products', 'images');
  await queryInterface.removeColumn('Users', 'emailVerified');
  await queryInterface.removeColumn('Users', 'role');
}
