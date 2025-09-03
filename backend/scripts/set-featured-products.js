// Script to set random products as featured
import db from '../models/index.js';

async function setFeaturedProducts() {
  try {
    console.log('Checking database connection...');
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if featured column exists
    let hasFeaturedColumn = false;
    try {
      const [columnCheck] = await db.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Products' AND column_name = 'featured')"
      );
      hasFeaturedColumn = columnCheck[0].exists;
      
      if (!hasFeaturedColumn) {
        // Add featured column if it doesn't exist
        await db.sequelize.query(
          "ALTER TABLE \"Products\" ADD COLUMN featured BOOLEAN NOT NULL DEFAULT false"
        );
        console.log('Added featured column to Products table.');
        hasFeaturedColumn = true;
      } else {
        console.log('Featured column already exists in Products table.');
      }
    } catch (err) {
      console.error("Column check failed:", err.message);
      return;
    }
    
    // Reset all products as not featured
    await db.sequelize.query(
      "UPDATE \"Products\" SET featured = false"
    );
    console.log('Reset all products to not featured.');
    
    // Get random products to set as featured
    const [products] = await db.sequelize.query(
      "SELECT id FROM \"Products\" ORDER BY RANDOM() LIMIT 6"
    );
    
    if (products.length === 0) {
      console.log('No products found to set as featured.');
      return;
    }
    
    // Set selected products as featured
    for (const product of products) {
      await db.sequelize.query(
        "UPDATE \"Products\" SET featured = true WHERE id = :id",
        {
          replacements: { id: product.id }
        }
      );
      console.log(`Set product #${product.id} as featured.`);
    }
    
    console.log(`Successfully set ${products.length} products as featured.`);
  } catch (error) {
    console.error('Error setting featured products:', error.message);
  } finally {
    // Close the database connection
    await db.sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the function
setFeaturedProducts()
  .then(() => console.log('Featured products setup complete.'))
  .catch(err => console.error('Failed to set featured products:', err));
