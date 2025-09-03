// Print database products in JSON format
import db from './models/index.js';

async function listProducts() {
  try {
    await db.sequelize.authenticate();
    
    const products = await db.Product.findAll({
      include: [
        { model: db.Category, through: { attributes: [] } },
        { model: db.Inventory, required: false }
      ],
      limit: 10
    });
    
    console.log(JSON.stringify(products.map(p => p.toJSON()), null, 2));
    console.log(`Total products: ${products.length}`);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
}

listProducts();
