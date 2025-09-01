'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Helpers
    const now = () => new Date();

    const checkExists = async (table, whereClause) => {
      try {
        const records = await queryInterface.sequelize.query(
          `SELECT * FROM "${table}" WHERE ${Object.keys(whereClause).map(k => `"${k}" = ?`).join(' AND ')}`,
          {
            replacements: Object.values(whereClause),
            type: Sequelize.QueryTypes.SELECT
          }
        );
        return records.length > 0;
      } catch (err) {
        console.error(`Exists check failed for ${table}:`, err.message);
        return false;
      }
    };

    const getOne = async (table, whereClause, columns = ['id']) => {
      const select = columns.map(c => `"${c}"`).join(', ');
      const rows = await queryInterface.sequelize.query(
        `SELECT ${select} FROM "${table}" WHERE ${Object.keys(whereClause).map(k => `"${k}" = ?`).join(' AND ')} LIMIT 1`,
        {
          replacements: Object.values(whereClause),
          type: Sequelize.QueryTypes.SELECT
        }
      );
      return rows[0] || null;
    };

    const getInventoryTable = async () => {
      // Detect if pluralized Inventories exists (post-rename migration)
      try {
        const [plural] = await queryInterface.sequelize.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = current_schema() AND table_name = 'Inventories') as exists",
          { type: Sequelize.QueryTypes.SELECT }
        );
        if (plural && (plural.exists === true || plural.exists === 't')) return 'Inventories';
      } catch {}
      return 'Inventory';
    };

    // 1) Categories (idempotent by name)
    const categoryNames = ['Smartphones', 'Tablets', 'Accessories'];
    for (const name of categoryNames) {
      const exists = await checkExists('Categories', { name });
      if (!exists) {
        await queryInterface.bulkInsert('Categories', [{ name, createdAt: now(), updatedAt: now() }]);
        console.log(`Inserted category: ${name}`);
      } else {
        console.log(`Category exists: ${name}`);
      }
    }

    // Get category ids
    const categories = {};
    for (const name of categoryNames) {
      const row = await getOne('Categories', { name }, ['id']);
      if (row) categories[name] = row.id;
    }

    // 2) Products (idempotent by name)
    const productsData = [
      {
        name: 'iPhone 15 Pro',
        price: 999.99,
        description: 'Latest iPhone with Pro camera system and titanium design.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
          'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400'
        ]),
        category: 'Smartphones'
      },
      {
        name: 'Samsung Galaxy S24 Ultra',
        price: 1199.99,
        description: 'Flagship Android phone with S Pen and incredible camera zoom.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400'
        ]),
        category: 'Smartphones'
      },
      {
        name: 'iPad Pro 12.9"',
        price: 1099.99,
        description: 'Professional tablet with M2 chip and Liquid Retina XDR display.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
          'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400'
        ]),
        category: 'Tablets'
      },
      {
        name: 'AirPods Pro (2nd Gen)',
        price: 249.99,
        description: 'Active noise cancellation and spatial audio experience.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400'
        ]),
        category: 'Accessories'
      }
    ];

    const products = [];
    for (const p of productsData) {
      const exists = await checkExists('Products', { name: p.name });
      if (!exists) {
        await queryInterface.bulkInsert('Products', [{
          name: p.name,
          price: p.price,
          description: p.description,
          images: p.images,
          createdAt: now(),
          updatedAt: now()
        }]);
        console.log(`Inserted product: ${p.name}`);
      } else {
        console.log(`Product exists: ${p.name}`);
      }
      const row = await getOne('Products', { name: p.name }, ['id']);
      if (row) products.push({ id: row.id, name: p.name, category: p.category });
    }

    // 3) ProductCategories (idempotent by pair)
    for (const p of products) {
      const categoryId = categories[p.category];
      if (!categoryId) continue;
      const pairExists = await checkExists('ProductCategories', { product_id: p.id, category_id: categoryId });
      if (!pairExists) {
        await queryInterface.bulkInsert('ProductCategories', [{ product_id: p.id, category_id: categoryId }]);
        console.log(`Linked product ${p.name} → ${p.category}`);
      }
    }

    // 4) Inventory (handle Inventory vs Inventories, idempotent by product_id)
    const inventoryTable = await getInventoryTable();
    for (const p of products) {
      const invExists = await checkExists(inventoryTable, { product_id: p.id });
      if (!invExists) {
        // default stock per sample
        const stockByName = {
          'iPhone 15 Pro': 25,
          'Samsung Galaxy S24 Ultra': 18,
          'iPad Pro 12.9"': 12,
          'AirPods Pro (2nd Gen)': 50
        };
        await queryInterface.bulkInsert(inventoryTable, [{
          product_id: p.id,
          stock_quantity: stockByName[p.name] ?? 10,
          createdAt: now(),
          updatedAt: now()
        }]);
        console.log(`Inserted inventory for ${p.name}`);
      }
    }

    // 5) Users (idempotent by email)
    const bcrypt = require('bcryptjs');
    const users = [
      {
        name: 'Admin User',
        email: 'admin@phonestore.com',
        role: 'admin',
        password: 'admin123'
      },
      {
        name: 'Demo User',
        email: 'user@example.com',
        role: 'user',
        password: 'password123'
      }
    ];

    for (const u of users) {
      const exists = await checkExists('Users', { email: u.email });
      if (!exists) {
        const passwordHash = await bcrypt.hash(u.password, 10);
        await queryInterface.bulkInsert('Users', [{
          name: u.name,
          email: u.email,
          passwordHash,
          role: u.role,
          emailVerified: true,
          createdAt: now(),
          updatedAt: now()
        }]);
        console.log(`Inserted user: ${u.email}`);
      } else {
        console.log(`User exists: ${u.email}`);
      }
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProductCategories', null, {});
    await queryInterface.bulkDelete('Inventory', null, {});
    await queryInterface.bulkDelete('Products', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
