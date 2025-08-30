export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('Users', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    name: { type: Sequelize.STRING, allowNull: false},
    email: { type: Sequelize.STRING, allowNull: false, unique: true },
    passwordHash: { type: Sequelize.STRING, allowNull: false },
    phone: { type: Sequelize.STRING },
    address: { type: Sequelize.TEXT },
    preferences: { type: Sequelize.JSONB },
    lastLogin: { type: Sequelize.DATE },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
}

export async function down(queryInterface) {
  await queryInterface.dropTable('Users');
}
