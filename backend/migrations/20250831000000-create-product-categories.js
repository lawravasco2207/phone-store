export async function up(queryInterface, Sequelize) {
  try {
    // Check if the table exists first
    const tableExists = await queryInterface.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'ProductCategories')",
      { type: Sequelize.QueryTypes.SELECT }
    );
    
    if (tableExists[0].exists) {
      console.log('ProductCategories table already exists');
      return;
    }

    console.log('Creating ProductCategories table...');
    // Create the ProductCategories table
    await queryInterface.createTable('ProductCategories', {
      product_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Products', key: 'id' },
        onDelete: 'CASCADE'
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'Categories', key: 'id' },
        onDelete: 'CASCADE'
      },
      createdAt: { 
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updatedAt: { 
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });
    
    // Add indexes
    await queryInterface.addIndex('ProductCategories', ['product_id']);
    await queryInterface.addIndex('ProductCategories', ['category_id']);
    
    console.log('ProductCategories table created successfully');
  } catch (error) {
    console.error('Error creating ProductCategories table:', error.message);
    throw error;
  }
}

export async function down(queryInterface) {
  return queryInterface.dropTable('ProductCategories');
}
