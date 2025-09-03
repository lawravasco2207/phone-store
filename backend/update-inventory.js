// Update inventory for all products
import db from './models/index.js';

async function updateInventory() {
  try {
    await db.sequelize.authenticate();
    console.log('Connected to database');
    
    // Get all products
    const products = await db.Product.findAll();
    console.log(`Found ${products.length} products in the database`);
    
    // Update or create inventory for each product
    let updated = 0;
    let created = 0;
    
    for (const product of products) {
      // Check if inventory exists
      let inventory = await db.Inventory.findOne({ 
        where: { product_id: product.id } 
      });
      
      if (inventory) {
        // Update existing inventory with random stock between 5-50
        await inventory.update({ 
          stock_quantity: Math.floor(Math.random() * 46) + 5,  // Random between 5-50
          updatedAt: new Date()
        });
        updated++;
      } else {
        // Create new inventory with random stock between 5-50
        await db.Inventory.create({
          product_id: product.id,
          stock_quantity: Math.floor(Math.random() * 46) + 5,  // Random between 5-50
          createdAt: new Date(),
          updatedAt: new Date()
        });
        created++;
      }
    }
    
    console.log(`Updated ${updated} existing inventory records`);
    console.log(`Created ${created} new inventory records`);
    console.log('Inventory update complete!');
    
    // Verify the update
    const inventoryCount = await db.Inventory.count();
    console.log(`Total inventory records: ${inventoryCount}`);
    
    // Sample some updated records
    const sampleInventory = await db.Inventory.findAll({
      limit: 5,
      order: [['updatedAt', 'DESC']]
    });
    
    console.log('\nSample updated inventory:');
    sampleInventory.forEach(inv => {
      console.log(`- Product ID: ${inv.product_id}, Stock: ${inv.stock_quantity}`);
    });
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await db.sequelize.close();
    process.exit(0);
  }
}

updateInventory();
