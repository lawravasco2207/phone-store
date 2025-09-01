export async function up(queryInterface, Sequelize) {
  // ChatSessions table
  await queryInterface.createTable('ChatSessions', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    user_id: { type: Sequelize.INTEGER, allowNull: true, references: { model: 'Users', key: 'id' }, onDelete: 'SET NULL' },
    session_id: { type: Sequelize.STRING, allowNull: false, unique: true },
    status: { type: Sequelize.ENUM('active', 'archived'), allowNull: false, defaultValue: 'active' },
    metadata: { type: Sequelize.JSONB },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.addIndex('ChatSessions', ['session_id'], { unique: true });
  await queryInterface.addIndex('ChatSessions', ['user_id']);

  // ChatMessages table
  await queryInterface.createTable('ChatMessages', {
    id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
    session_id_fk: { type: Sequelize.INTEGER, allowNull: false, references: { model: 'ChatSessions', key: 'id' }, onDelete: 'CASCADE' },
    role: { type: Sequelize.ENUM('system', 'user', 'assistant', 'tool'), allowNull: false },
    content: { type: Sequelize.TEXT, allowNull: false },
    tool_calls: { type: Sequelize.JSONB },
    createdAt: { type: Sequelize.DATE, allowNull: false },
    updatedAt: { type: Sequelize.DATE, allowNull: false },
  });
  await queryInterface.addIndex('ChatMessages', ['session_id_fk']);
}

export async function down(queryInterface) {
  await queryInterface.dropTable('ChatMessages');
  await queryInterface.dropTable('ChatSessions');
}
