// Migration for Product Ingestion System - Adds new tables and enhances products table
export async function up(queryInterface, Sequelize) {
  // Helper function to check if column exists before adding it
  const columnExists = async (tableName, columnName) => {
    try {
      // This query will throw an error if the column doesn't exist
      await queryInterface.sequelize.query(
        `SELECT "${columnName}" FROM "${tableName}" LIMIT 0;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      return true;
    } catch (e) {
      return false;
    }
  };

  // Helper function to check if table exists
  const tableExists = async (tableName) => {
    try {
      await queryInterface.sequelize.query(
        `SELECT 1 FROM "${tableName}" LIMIT 0;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      return true;
    } catch (e) {
      return false;
    }
  };

  // Step 1: Modify existing products table to add needed fields
  if (!(await columnExists('Products', 'slug'))) {
    await queryInterface.addColumn('Products', 'slug', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true,
    });
  }
  
  if (!(await columnExists('Products', 'brand'))) {
    await queryInterface.addColumn('Products', 'brand', {
      type: Sequelize.STRING,
      allowNull: true
    });
  }
  
  if (!(await columnExists('Products', 'attributes'))) {
    await queryInterface.addColumn('Products', 'attributes', {
      type: Sequelize.JSONB,
      allowNull: true
    });
  }
  
  if (!(await columnExists('Products', 'external_id'))) {
    await queryInterface.addColumn('Products', 'external_id', {
      type: Sequelize.STRING,
      allowNull: true,
      unique: true
    });
  }
  
  // Step 2: Create product_variants table
  if (!(await tableExists('ProductVariants'))) {
    await queryInterface.createTable('ProductVariants', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      product_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Products', key: 'id' },
        onDelete: 'CASCADE',
        allowNull: false
      },
      sku: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      barcode: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      options: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      price_cents: {
        type: Sequelize.INTEGER,
        allowNull: false
      },
      compare_at_price_cents: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      currency: {
        type: Sequelize.STRING,
        allowNull: false,
        defaultValue: 'USD'
      },
      weight_grams: {
        type: Sequelize.INTEGER,
        allowNull: true
      },
      dimensions: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  }

  // Step 3: Enhance inventory table to reference variants
  if (await tableExists('Inventory')) {
    if (!(await columnExists('Inventory', 'variant_id'))) {
      await queryInterface.addColumn('Inventory', 'variant_id', {
        type: Sequelize.INTEGER,
        references: { model: 'ProductVariants', key: 'id' },
        onDelete: 'CASCADE',
        allowNull: true
      });
    }
    
    if (!(await columnExists('Inventory', 'safety_stock'))) {
      await queryInterface.addColumn('Inventory', 'safety_stock', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0
      });
    }
    
    if (!(await columnExists('Inventory', 'warehouse_id'))) {
      await queryInterface.addColumn('Inventory', 'warehouse_id', {
        type: Sequelize.INTEGER,
        allowNull: true
      });
    }
  }

  // Step 4: Create sellers table
  if (!(await tableExists('Sellers'))) {
    await queryInterface.createTable('Sellers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      name: {
        type: Sequelize.STRING,
        allowNull: false
      },
      contact_email: {
        type: Sequelize.STRING,
        allowNull: false
      },
      api_key: {
        type: Sequelize.STRING,
        allowNull: true,
        unique: true
      },
      webhook_url: {
        type: Sequelize.STRING,
        allowNull: true
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'pending'),
        allowNull: false,
        defaultValue: 'active'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  }

  // Step 5: Create offers table
  if (!(await tableExists('Offers'))) {
    await queryInterface.createTable('Offers', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      product_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Products', key: 'id' },
        onDelete: 'CASCADE',
        allowNull: false
      },
      seller_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Sellers', key: 'id' },
        onDelete: 'CASCADE',
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('draft', 'active', 'inactive'),
        allowNull: false,
        defaultValue: 'draft'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  }

  // Step 6: Create ingestion_jobs table
  if (!(await tableExists('IngestionJobs'))) {
    await queryInterface.createTable('IngestionJobs', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      seller_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Sellers', key: 'id' },
        onDelete: 'SET NULL',
        allowNull: true
      },
      type: {
        type: Sequelize.ENUM('manual', 'csv', 'api'),
        allowNull: false
      },
      status: {
        type: Sequelize.ENUM('queued', 'processing', 'done', 'failed'),
        allowNull: false,
        defaultValue: 'queued'
      },
      stats: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      file_path: {
        type: Sequelize.STRING,
        allowNull: true
      },
      options: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  }

  // Step 7: Create ingestion_events table
  if (!(await tableExists('IngestionEvents'))) {
    await queryInterface.createTable('IngestionEvents', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      job_id: {
        type: Sequelize.INTEGER,
        references: { model: 'IngestionJobs', key: 'id' },
        onDelete: 'CASCADE',
        allowNull: false
      },
      level: {
        type: Sequelize.ENUM('info', 'warn', 'error'),
        allowNull: false,
        defaultValue: 'info'
      },
      code: {
        type: Sequelize.STRING,
        allowNull: true
      },
      message: {
        type: Sequelize.TEXT,
        allowNull: false
      },
      payload: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  }

  // Step 8: Create media_assets table
  if (!(await tableExists('MediaAssets'))) {
    await queryInterface.createTable('MediaAssets', {
      id: {
        type: Sequelize.INTEGER,
        primaryKey: true,
        autoIncrement: true
      },
      url: {
        type: Sequelize.STRING,
        allowNull: false
      },
      purpose: {
        type: Sequelize.ENUM('main', 'gallery'),
        allowNull: false,
        defaultValue: 'gallery'
      },
      product_id: {
        type: Sequelize.INTEGER,
        references: { model: 'Products', key: 'id' },
        onDelete: 'CASCADE',
        allowNull: true
      },
      variant_id: {
        type: Sequelize.INTEGER,
        references: { model: 'ProductVariants', key: 'id' },
        onDelete: 'CASCADE',
        allowNull: true
      },
      meta: {
        type: Sequelize.JSONB,
        allowNull: true
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  }

  // Step 9: Add category_id column and index if they don't exist
  if (!(await columnExists('Products', 'category_id'))) {
    await queryInterface.addColumn('Products', 'category_id', {
      type: Sequelize.INTEGER,
      references: { model: 'Categories', key: 'id' },
      onDelete: 'SET NULL',
      allowNull: true
    });
    
    // Add index for the new column
    await queryInterface.addIndex('Products', ['category_id']);
  }

  // Step 10: Update the user roles to include 'seller' if needed
  try {
    // First check if the 'seller' role exists in the enum
    const enumInfo = await queryInterface.sequelize.query(
      `SELECT 
         pg_enum.enumlabel
       FROM pg_type 
       JOIN pg_enum ON pg_enum.enumtypid = pg_type.oid
       WHERE pg_type.typname = 'enum_Users_role'`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );
    
    const roleExists = enumInfo.some(row => row.enumlabel === 'seller') && 
                     enumInfo.some(row => row.enumlabel === 'viewer');
    
    if (!roleExists) {
      // Modify the enum to add the missing roles
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'seller'`
      );
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_Users_role" ADD VALUE IF NOT EXISTS 'viewer'`
      );
    }
  } catch (error) {
    console.error('Error updating user roles:', error);
  }
}

export async function down(queryInterface, Sequelize) {
  // Helper function to check if table exists
  const tableExists = async (tableName) => {
    try {
      await queryInterface.sequelize.query(
        `SELECT 1 FROM "${tableName}" LIMIT 0;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      return true;
    } catch (e) {
      return false;
    }
  };

  // Helper function to check if column exists
  const columnExists = async (tableName, columnName) => {
    try {
      await queryInterface.sequelize.query(
        `SELECT "${columnName}" FROM "${tableName}" LIMIT 0;`,
        { type: queryInterface.sequelize.QueryTypes.SELECT }
      );
      return true;
    } catch (e) {
      return false;
    }
  };

  // Revert all changes in reverse order
  if (await tableExists('MediaAssets')) {
    await queryInterface.dropTable('MediaAssets');
  }
  
  if (await tableExists('IngestionEvents')) {
    await queryInterface.dropTable('IngestionEvents');
  }
  
  if (await tableExists('IngestionJobs')) {
    await queryInterface.dropTable('IngestionJobs');
  }
  
  if (await tableExists('Offers')) {
    await queryInterface.dropTable('Offers');
  }
  
  if (await tableExists('Sellers')) {
    await queryInterface.dropTable('Sellers');
  }
  
  // Remove columns from Inventory
  if (await tableExists('Inventory')) {
    if (await columnExists('Inventory', 'variant_id')) {
      await queryInterface.removeColumn('Inventory', 'variant_id');
    }
    if (await columnExists('Inventory', 'safety_stock')) {
      await queryInterface.removeColumn('Inventory', 'safety_stock');
    }
    if (await columnExists('Inventory', 'warehouse_id')) {
      await queryInterface.removeColumn('Inventory', 'warehouse_id');
    }
  }
  
  // Drop ProductVariants table
  if (await tableExists('ProductVariants')) {
    await queryInterface.dropTable('ProductVariants');
  }
  
  // Remove columns from Products
  if (await tableExists('Products')) {
    if (await columnExists('Products', 'slug')) {
      await queryInterface.removeColumn('Products', 'slug');
    }
    if (await columnExists('Products', 'brand')) {
      await queryInterface.removeColumn('Products', 'brand');
    }
    if (await columnExists('Products', 'attributes')) {
      await queryInterface.removeColumn('Products', 'attributes');
    }
    if (await columnExists('Products', 'external_id')) {
      await queryInterface.removeColumn('Products', 'external_id');
    }
    if (await columnExists('Products', 'category_id')) {
      await queryInterface.removeColumn('Products', 'category_id');
    }
  }
  
  // Note: We're not reverting the user roles as that could potentially disrupt existing data
}
