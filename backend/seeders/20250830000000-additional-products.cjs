'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Detect correct inventory table name (Inventory vs Inventories)
    const getInventoryTable = async () => {
      try {
        const [plural] = await queryInterface.sequelize.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'Inventories') as exists",
          { type: Sequelize.QueryTypes.SELECT }
        );
        if (plural && (plural.exists === true || plural.exists === 't')) return 'Inventories';
      } catch {}
      return 'Inventory';
    };
    // Helper function to check if records exist before inserting
    const checkExists = async (table, whereClause) => {
      try {
        const records = await queryInterface.sequelize.query(
          `SELECT * FROM "${table}" WHERE ${Object.keys(whereClause).map(key => `"${key}" = ?`).join(' AND ')}`,
          { 
            replacements: Object.values(whereClause),
            type: Sequelize.QueryTypes.SELECT 
          }
        );
        return records.length > 0;
      } catch (error) {
        console.error(`Error checking if record exists in ${table}:`, error.message);
        return false;
      }
    };

    // Helper function to safely insert data if it doesn't exist
  const safeInsert = async (table, data) => {
      for (const item of data) {
        try {
          const exists = await checkExists(table, { id: item.id });
          if (!exists) {
            await queryInterface.bulkInsert(table, [item], {});
            console.log(`Inserted ${table} with id ${item.id}`);
          } else {
            console.log(`Skipping insert for ${table} with id ${item.id} (already exists)`);
          }
        } catch (error) {
          console.error(`Failed to insert into ${table}:`, error.message);
        }
      }
    };

    try {
      // Categories
      const categories = [
        { id: 10, name: 'Premium Phones', createdAt: new Date(), updatedAt: new Date() },
        { id: 11, name: 'Budget Phones', createdAt: new Date(), updatedAt: new Date() },
        { id: 12, name: 'Wearables', createdAt: new Date(), updatedAt: new Date() },
      ];
      await safeInsert('Categories', categories);

      // Products
      const products = [
        {
          id: 10,
          name: 'Google Pixel 8 Pro',
          price: 899.99,
          description: 'Pure Android experience with outstanding camera capabilities.',
          images: JSON.stringify([
            'https://images.unsplash.com/photo-1598327105666-5b89351aff97?w=400',
            'https://images.unsplash.com/photo-1605236453806-6ff36851218e?w=400'
          ]),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 11,
          name: 'OnePlus 12',
          price: 799.99,
          description: 'Flagship killer with Snapdragon processor and fast charging.',
          images: JSON.stringify([
            'https://images.unsplash.com/photo-1564156280315-1d42b4651629?w=400',
            'https://images.unsplash.com/photo-1557690756-62754e561982?w=400'
          ]),
          createdAt: new Date(),
          updatedAt: new Date()
        },
        {
          id: 12,
          name: 'Apple Watch Ultra',
          price: 799.99,
          description: 'Advanced features for outdoor adventures and fitness tracking.',
          images: JSON.stringify([
            'https://images.unsplash.com/photo-1579586337278-3befd40fd17a?w=400',
            'https://images.unsplash.com/photo-1434494878577-86c23bcb06b9?w=400'
          ]),
          createdAt: new Date(),
          updatedAt: new Date()
        }
      ];
      await safeInsert('Products', products);

      // Associate products with categories
      // Check if association exists before inserting
      const productCategories = [
        { product_id: 10, category_id: 10 },
        { product_id: 11, category_id: 11 },
        { product_id: 12, category_id: 12 },
      ];
      
      for (const mapping of productCategories) {
        try {
          const exists = await queryInterface.sequelize.query(
            `SELECT * FROM "ProductCategories" WHERE "product_id" = ? AND "category_id" = ?`,
            {
              replacements: [mapping.product_id, mapping.category_id],
              type: Sequelize.QueryTypes.SELECT
            }
          ).then(records => records.length > 0)
            .catch(() => false); // If table doesn't exist, handle gracefully

          if (!exists) {
            await queryInterface.bulkInsert('ProductCategories', [mapping], {});
            console.log(`Inserted ProductCategory mapping: ${mapping.product_id} -> ${mapping.category_id}`);
          } else {
            console.log(`Skipping ProductCategory mapping (already exists): ${mapping.product_id} -> ${mapping.category_id}`);
          }
        } catch (error) {
          console.error(`Failed to insert product category mapping: ${error.message}`);
        }
      }

      // Add inventory
      const inventory = [
        { id: 10, product_id: 10, stock_quantity: 30, createdAt: new Date(), updatedAt: new Date() },
        { id: 11, product_id: 11, stock_quantity: 22, createdAt: new Date(), updatedAt: new Date() },
        { id: 12, product_id: 12, stock_quantity: 15, createdAt: new Date(), updatedAt: new Date() },
      ];
  const inventoryTable = await getInventoryTable();
  await safeInsert(inventoryTable, inventory);
    } catch (error) {
      console.error('Seed failed:', error);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProductCategories', {
      [Sequelize.Op.or]: [
        { product_id: 10 },
        { product_id: 11 },
        { product_id: 12 }
      ]
    }, {});
    await queryInterface.bulkDelete('Inventory', {
      [Sequelize.Op.or]: [
        { id: 10 },
        { id: 11 },
        { id: 12 }
      ]
    }, {});
    await queryInterface.bulkDelete('Products', {
      [Sequelize.Op.or]: [
        { id: 10 },
        { id: 11 },
        { id: 12 }
      ]
    }, {});
    await queryInterface.bulkDelete('Categories', {
      [Sequelize.Op.or]: [
        { id: 10 },
        { id: 11 },
        { id: 12 }
      ]
    }, {});
  }
};
