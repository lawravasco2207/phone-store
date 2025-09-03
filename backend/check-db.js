import { sequelize } from './models/index.js';

async function checkTables() {
  try {
    const [results] = await sequelize.query('SELECT table_name FROM information_schema.tables WHERE table_schema = \'public\';');
    console.log('Tables in database:', results);
    
    // Check if Categories table exists
    const categoryExists = results.some(r => r.table_name === 'Categories');
    console.log('Categories table exists:', categoryExists);
    
    if (categoryExists) {
      // Check category count
      const [categories] = await sequelize.query('SELECT COUNT(*) FROM "Categories";');
      console.log('Categories count:', categories[0].count);
      
      // List categories
      const [categoryList] = await sequelize.query('SELECT id, name FROM "Categories" LIMIT 10;');
      console.log('Categories:', categoryList);
    }
    
    // Check if ProductCategories table exists
    const productCategoriesExists = results.some(r => r.table_name === 'ProductCategories');
    console.log('ProductCategories table exists:', productCategoriesExists);
    
    if (productCategoriesExists) {
      // Check association count
      const [associations] = await sequelize.query('SELECT COUNT(*) FROM "ProductCategories";');
      console.log('Product-Category associations count:', associations[0].count);
    }
  } catch (error) {
    console.error('Error checking database:', error);
  } finally {
    // Close the connection
    await sequelize.close();
  }
}

checkTables();
