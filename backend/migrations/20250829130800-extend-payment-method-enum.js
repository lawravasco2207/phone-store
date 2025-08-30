export async function up(queryInterface) {
  // Update enum to include 'mock' for test/checkout flow
  await queryInterface.sequelize.query("ALTER TYPE \"enum_Payments_payment_method\" ADD VALUE IF NOT EXISTS 'mock';");
}

export async function down() {
  // No easy downgrade for enum value; keep as-is
}
