// Check if products exist in the database
import db from './models/index.js';

async function checkProducts() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database');
    
    const count = await db.Product.count();
    console.log(`Found ${count} products in the database`);
    
    if (count === 0) {
      console.log('No products found. Trying to run seed...');
    } else {
      // Get a sample of products
      const products = await db.Product.findAll({
        limit: 3,
        include: [
          { model: db.Category, through: { attributes: [] } },
          { model: db.Inventory, required: false }
        ]
      });
      
      console.log('Sample products:');
      products.forEach(product => {
        const p = product.toJSON();
        console.log(`- ${p.name} (ID: ${p.id}, Price: ${p.price})`);
        console.log(`  Categories: ${p.Categories?.map(c => c.name).join(', ') || 'None'}`);
        console.log(`  Inventory: ${p.Inventory ? p.Inventory.stock_quantity : 'None'}`);
      });
    }
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

checkProducts();
