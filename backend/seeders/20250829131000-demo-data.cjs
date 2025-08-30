'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // Create categories
    await queryInterface.bulkInsert('Categories', [
      { id: 1, name: 'Smartphones', createdAt: new Date(), updatedAt: new Date() },
      { id: 2, name: 'Tablets', createdAt: new Date(), updatedAt: new Date() },
      { id: 3, name: 'Accessories', createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Create products
    await queryInterface.bulkInsert('Products', [
      {
        id: 1,
        name: 'iPhone 15 Pro',
        price: 999.99,
        description: 'Latest iPhone with Pro camera system and titanium design.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=400',
          'https://images.unsplash.com/photo-1556656793-08538906a9f8?w=400'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Samsung Galaxy S24 Ultra',
        price: 1199.99,
        description: 'Flagship Android phone with S Pen and incredible camera zoom.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1610945415295-d9bbf067e59c?w=400',
          'https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'iPad Pro 12.9"',
        price: 1099.99,
        description: 'Professional tablet with M2 chip and Liquid Retina XDR display.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1544244015-0df4b3ffc6b0?w=400',
          'https://images.unsplash.com/photo-1561154464-82e9adf32764?w=400'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: 'AirPods Pro (2nd Gen)',
        price: 249.99,
        description: 'Active noise cancellation and spatial audio experience.',
        images: JSON.stringify([
          'https://images.unsplash.com/photo-1606220945770-b5b6c2c55bf1?w=400'
        ]),
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);

    // Associate products with categories
    await queryInterface.bulkInsert('ProductCategories', [
      { product_id: 1, category_id: 1 },
      { product_id: 2, category_id: 1 },
      { product_id: 3, category_id: 2 },
      { product_id: 4, category_id: 3 },
    ]);

    // Add inventory
    await queryInterface.bulkInsert('Inventory', [
      { product_id: 1, stock_quantity: 25, createdAt: new Date(), updatedAt: new Date() },
      { product_id: 2, stock_quantity: 18, createdAt: new Date(), updatedAt: new Date() },
      { product_id: 3, stock_quantity: 12, createdAt: new Date(), updatedAt: new Date() },
      { product_id: 4, stock_quantity: 50, createdAt: new Date(), updatedAt: new Date() },
    ]);

    // Create a demo admin user
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash('admin123', 10);
    
    await queryInterface.bulkInsert('Users', [
      {
        id: 1,
        name: 'Admin User',
        email: 'admin@phonestore.com',
        passwordHash: hashedPassword,
        role: 'admin',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Demo User',
        email: 'user@example.com',
        passwordHash: await bcrypt.hash('password123', 10),
        role: 'user',
        emailVerified: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ]);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ProductCategories', null, {});
    await queryInterface.bulkDelete('Inventory', null, {});
    await queryInterface.bulkDelete('Products', null, {});
    await queryInterface.bulkDelete('Categories', null, {});
    await queryInterface.bulkDelete('Users', null, {});
  }
};
