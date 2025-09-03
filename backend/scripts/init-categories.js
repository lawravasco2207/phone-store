// Script to initialize the Categories table and product relationships
import db from '../models/index.js';

async function initCategories() {
  try {
    console.log('Checking database connection...');
    await db.sequelize.authenticate();
    console.log('Database connection established successfully.');

    // Check if Categories table exists
    const [tableCheck] = await db.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Categories')"
    );
    
    if (!tableCheck[0].exists) {
      console.log('Categories table does not exist. Creating table...');
      try {
        // Create Categories table
        await db.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "Categories" (
            "id" SERIAL PRIMARY KEY,
            "name" VARCHAR(255) NOT NULL,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
          );
        `);
        console.log('Categories table created successfully.');
        
        // Create ProductCategories junction table
        await db.sequelize.query(`
          CREATE TABLE IF NOT EXISTS "ProductCategories" (
            "ProductId" INTEGER NOT NULL REFERENCES "Products"("id") ON DELETE CASCADE,
            "CategoryId" INTEGER NOT NULL REFERENCES "Categories"("id") ON DELETE CASCADE,
            "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY ("ProductId", "CategoryId")
          );
        `);
        console.log('ProductCategories junction table created successfully.');
        
        // Insert default categories
        console.log('Adding default categories...');
        const defaultCategories = [
          'Smartphones',
          'Accessories',
          'Wearables',
          'Audio',
          'Tablets',
          'Chargers',
          'Cases',
          'Screen Protectors'
        ];
        
        for (const name of defaultCategories) {
          await db.sequelize.query(`
            INSERT INTO "Categories" (name, "createdAt", "updatedAt")
            VALUES ('${name}', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);
          `);
        }
        console.log('Default categories added successfully.');
        
        // Map existing products to categories based on their category field
        console.log('Mapping existing products to categories...');
        const [products] = await db.sequelize.query(`SELECT id, category FROM "Products";`);
        
        for (const product of products) {
          if (product.category) {
            // Find corresponding category
            const [categoryResult] = await db.sequelize.query(`
              SELECT id FROM "Categories" WHERE name = '${product.category}';
            `);
            
            if (categoryResult.length > 0) {
              const categoryId = categoryResult[0].id;
              // Add to junction table
              await db.sequelize.query(`
                INSERT INTO "ProductCategories" ("ProductId", "CategoryId", "createdAt", "updatedAt")
                VALUES (${product.id}, ${categoryId}, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                ON CONFLICT ("ProductId", "CategoryId") DO NOTHING;
              `);
            }
          }
        }
        console.log('Existing products mapped to categories successfully.');
      } catch (error) {
        console.error('Error creating tables:', error.message);
      }
    } else {
      console.log('Categories table already exists.');
    }
  } catch (error) {
    console.error('Database initialization error:', error.message);
  } finally {
    // Close the database connection
    await db.sequelize.close();
    console.log('Database connection closed.');
  }
}

// Run the initialization function
initCategories()
  .then(() => console.log('Category initialization complete.'))
  .catch(err => console.error('Failed to initialize categories:', err));
