export async function up(queryInterface, Sequelize) {
  try {
    // Check if Inventory table exists (singular form)
    const inventorySingularExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'Inventory')",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // Check if Inventories table exists (plural form)
    const inventoriesPluralExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'Inventories')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Case 1: If singular exists but plural doesn't, rename table
    if (inventorySingularExists[0].exists && !inventoriesPluralExists[0].exists) {
      console.log('Renaming Inventory table to Inventories...');
      await queryInterface.renameTable('Inventory', 'Inventories');
      console.log('Successfully renamed Inventory table to Inventories');
    } 
    // Case 2: If plural doesn't exist and singular doesn't exist either, create the table
    else if (!inventoriesPluralExists[0].exists && !inventorySingularExists[0].exists) {
      console.log('Creating Inventories table...');
      await queryInterface.createTable('Inventories', {
        id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true },
        product_id: {
          type: Sequelize.INTEGER,
          allowNull: false,
          references: { model: 'Products', key: 'id' },
          onDelete: 'CASCADE'
        },
        variant_id: {
          type: Sequelize.INTEGER,
          allowNull: true,
          references: { model: 'ProductVariants', key: 'id' },
          onDelete: 'CASCADE'
        },
        stock_quantity: { type: Sequelize.INTEGER, allowNull: false, defaultValue: 0 },
        restock_date: { type: Sequelize.DATE },
        createdAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
        updatedAt: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') }
      });
      await queryInterface.addIndex('Inventories', ['product_id']);
      await queryInterface.addIndex('Inventories', ['variant_id']);
      console.log('Successfully created Inventories table');
    }
    // Case 3: If plural already exists, do nothing
    else if (inventoriesPluralExists[0].exists) {
      console.log('Inventories table already exists, no action needed');
    }
  } catch (error) {
    console.error('Error fixing inventory table name:', error.message);
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  try {
    // Check if Inventories table exists (plural form)
    const inventoriesPluralExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'Inventories')",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    // Check if Inventory table exists (singular form)
    const inventorySingularExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'Inventory')",
      { type: Sequelize.QueryTypes.SELECT }
    );

    // If plural exists but singular doesn't, rename back
    if (inventoriesPluralExists[0].exists && !inventorySingularExists[0].exists) {
      console.log('Reverting: Renaming Inventories table back to Inventory...');
      await queryInterface.renameTable('Inventories', 'Inventory');
      console.log('Successfully reverted table name');
    } 
    // If table was created in up(), drop it
    else if (inventoriesPluralExists[0].exists && !inventorySingularExists[0].exists) {
      await queryInterface.dropTable('Inventories');
    }
  } catch (error) {
    console.error('Error reverting inventory table fix:', error.message);
    throw error;
  }
}
