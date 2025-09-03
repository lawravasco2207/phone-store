// Script to ensure all products have inventory data with stock
import db from './models/index.js';

async function ensureInventory() {
  try {
    console.log('Connected to database, ensuring all products have inventory...');
    
    // Get all products
    const products = await db.Product.findAll();
    console.log(`Found ${products.length} products in the database`);
    
    // Update or create inventory for each product with stock quantity of 10
    let updated = 0;
    let created = 0;
    
    for (const product of products) {
      // Check if inventory exists
      let inventory = await db.Inventory.findOne({ 
        where: { product_id: product.id } 
      });
      
      if (inventory) {
        // Update existing inventory to ensure it has stock
        await inventory.update({ 
          stock_quantity: 10,
          updatedAt: new Date()
        });
        updated++;
      } else {
        // Create new inventory with stock
        await db.Inventory.create({
          product_id: product.id,
          stock_quantity: 10,
          createdAt: new Date(),
          updatedAt: new Date()
        });
        created++;
      }
    }
    
    console.log(`Updated ${updated} existing inventory records`);
    console.log(`Created ${created} new inventory records`);
    console.log('All products now have inventory with stock!');
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

ensureInventory();
