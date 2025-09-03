// Simple script to create sample products
import db from './models/index.js';

async function seedProducts() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database');
    
    // Create some sample categories
    const categories = [
      { name: 'Phones', description: 'Mobile phones and smartphones' },
      { name: 'Laptops', description: 'Notebook computers and laptops' },
      { name: 'Accessories', description: 'Phone and laptop accessories' }
    ];
    
    for (const category of categories) {
      const [cat] = await db.Category.findOrCreate({
        where: { name: category.name },
        defaults: category
      });
      console.log(`Category ${cat.name} created or found`);
    }
    
    // Get category IDs
    const allCategories = await db.Category.findAll();
    const categoryMap = Object.fromEntries(
      allCategories.map(c => [c.name, c.id])
    );
    console.log('Categories:', categoryMap);
    
    // Create sample products
    const products = [
      {
        name: 'iPhone 14 Pro',
        price: 999.99,
        description: 'Latest Apple iPhone with advanced camera system',
        images: ['https://example.com/iphone14.jpg'],
        featured: true
      },
      {
        name: 'Samsung Galaxy S23',
        price: 899.99,
        description: 'Powerful Android smartphone with excellent display',
        images: ['https://example.com/galaxy-s23.jpg'],
        featured: true
      },
      {
        name: 'MacBook Pro 16"',
        price: 2499.99,
        description: 'High-performance laptop for professionals',
        images: ['https://example.com/macbook-pro.jpg'],
        featured: true
      },
      {
        name: 'Dell XPS 15',
        price: 1899.99,
        description: 'Sleek Windows laptop with stunning display',
        images: ['https://example.com/dell-xps.jpg'],
        featured: false
      },
      {
        name: 'AirPods Pro',
        price: 249.99,
        description: 'Wireless earbuds with noise cancellation',
        images: ['https://example.com/airpods-pro.jpg'],
        featured: true
      }
    ];
    
    for (const product of products) {
      const [prod, created] = await db.Product.findOrCreate({
        where: { name: product.name },
        defaults: product
      });
      
      if (created) {
        console.log(`Product ${prod.name} created`);
        
        // Add inventory
        await db.Inventory.findOrCreate({
          where: { product_id: prod.id },
          defaults: {
            product_id: prod.id,
            stock_quantity: Math.floor(Math.random() * 100) + 10,
            restock_date: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30) // 30 days from now
          }
        });
        
        // Assign categories
        if (prod.name.includes('iPhone') || prod.name.includes('Galaxy') || prod.name.includes('Phone')) {
          await prod.addCategory(categoryMap['Phones']);
        }
        
        if (prod.name.includes('MacBook') || prod.name.includes('XPS') || prod.name.includes('Laptop')) {
          await prod.addCategory(categoryMap['Laptops']);
        }
        
        if (prod.name.includes('AirPods') || prod.name.includes('Case') || prod.name.includes('Charger')) {
          await prod.addCategory(categoryMap['Accessories']);
        }
      } else {
        console.log(`Product ${prod.name} already exists`);
      }
    }
    
    console.log('Seed completed successfully');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

seedProducts();
