// Check inventory for all products
import db from './models/index.js';

async function checkInventory() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database');
    
    // Get all products with their inventory
    const products = await db.Product.findAll({
      include: [
        { model: db.Category, through: { attributes: [] } },
        { model: db.Inventory, required: false }
      ]
    });
    
    console.log(`Found ${products.length} products in the database`);
    
    // Check which products have inventory
    const productsWithInventory = products.filter(p => p.Inventory !== null);
    console.log(`${productsWithInventory.length} products have inventory records`);
    
    // Check which products have stock
    const productsInStock = products.filter(p => p.Inventory && p.Inventory.stock_quantity > 0);
    console.log(`${productsInStock.length} products are in stock (stock_quantity > 0)`);
    
    // Print inventory details for all products
    console.log('\nInventory details:');
    products.forEach(product => {
      const p = product.toJSON();
      console.log(`- ${p.name} (ID: ${p.id})`);
      console.log(`  Categories: ${p.Categories?.map(c => c.name).join(', ') || 'None'}`);
      console.log(`  Inventory: ${p.Inventory ? p.Inventory.stock_quantity : 'None'}`);
    });
    
    // Print products without inventory
    const productsWithoutInventory = products.filter(p => p.Inventory === null);
    console.log('\nProducts without inventory records:');
    productsWithoutInventory.forEach(p => {
      console.log(`- ${p.name} (ID: ${p.id})`);
    });
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

checkInventory();
