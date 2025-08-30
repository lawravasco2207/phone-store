export async function up(queryInterface) {
  // Orders
  await queryInterface.removeIndex('Orders', ['user_id']).catch(() => {});
  await queryInterface.addIndex('Orders', ['user_id']);

  await queryInterface.removeIndex('Orders', ['order_status']).catch(() => {});
  await queryInterface.addIndex('Orders', ['order_status']);

  await queryInterface.removeIndex('Orders', ['createdAt']).catch(() => {});
  await queryInterface.addIndex('Orders', ['createdAt']);

  // Payments
  await queryInterface.removeIndex('Payments', ['user_id']).catch(() => {});
  await queryInterface.addIndex('Payments', ['user_id']);

  await queryInterface.removeIndex('Payments', ['order_id']).catch(() => {});
  await queryInterface.addIndex('Payments', ['order_id']);

  await queryInterface.removeIndex('Payments', ['payment_status']).catch(() => {});
  await queryInterface.addIndex('Payments', ['payment_status']);

  await queryInterface.removeIndex('Payments', ['createdAt']).catch(() => {});
  await queryInterface.addIndex('Payments', ['createdAt']);

  await queryInterface.removeIndex('Payments', ['transaction_id']).catch(() => {});
  await queryInterface.addIndex('Payments', ['transaction_id'], { unique: true });
}

export async function down(queryInterface) {
  await queryInterface.removeIndex('Orders', ['user_id']).catch(() => {});
  await queryInterface.removeIndex('Orders', ['order_status']).catch(() => {});
  await queryInterface.removeIndex('Orders', ['createdAt']).catch(() => {});

  await queryInterface.removeIndex('Payments', ['user_id']).catch(() => {});
  await queryInterface.removeIndex('Payments', ['order_id']).catch(() => {});
  await queryInterface.removeIndex('Payments', ['payment_status']).catch(() => {});
  await queryInterface.removeIndex('Payments', ['createdAt']).catch(() => {});
  await queryInterface.removeIndex('Payments', ['transaction_id']).catch(() => {});
}
