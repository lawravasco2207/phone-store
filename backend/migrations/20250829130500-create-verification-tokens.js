export async function up(queryInterface, Sequelize) {
  await queryInterface.createTable('VerificationTokens', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'Users', key: 'id' }, onDelete: 'CASCADE' },
    token: { type: Sequelize.STRING, allowNull: false },
    type: { type: Sequelize.ENUM('email_verify'), allowNull: false },
    expiresAt: { type: Sequelize.DATE, allowNull: false },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.addIndex('VerificationTokens', ['user_id']);
  await queryInterface.addIndex('VerificationTokens', ['token']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('VerificationTokens');
}
