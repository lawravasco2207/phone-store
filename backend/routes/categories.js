// Categories API endpoints
import express from 'express';
import db from '../models/index.js';

const router = express.Router();

// Check if Category model and table exist
const checkCategoryTable = async () => {
  try {
    if (!db.Category) {
      return false;
    }
    
    const [tableCheck] = await db.sequelize.query(
      "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Categories')"
    );
    return tableCheck[0].exists;
  } catch (err) {
    console.error("Category table check failed:", err.message);
    return false;
  }
};

// GET /api/categories
router.get('/', async (req, res) => {
  try {
    // Check if Categories table exists
    const categoryTableExists = await checkCategoryTable();
    
    if (!categoryTableExists) {
      // Return fallback categories if table doesn't exist
      const fallbackCategories = [
        { id: 1, name: 'Smartphones' },
        { id: 2, name: 'Accessories' },
        { id: 3, name: 'Wearables' },
        { id: 4, name: 'Audio' }
      ];
      return res.json({ 
        success: true, 
        data: { categories: fallbackCategories } 
      });
    }
    
    // Get categories from the database
    const categories = await db.Category.findAll({
      order: [['name', 'ASC']]
    });
    
    return res.json({ 
      success: true, 
      data: { categories } 
    });
  } catch (e) {
    console.error(e);
    // Return fallback categories on error
    const fallbackCategories = [
      { id: 1, name: 'Smartphones' },
      { id: 2, name: 'Accessories' },
      { id: 3, name: 'Wearables' },
      { id: 4, name: 'Audio' }
    ];
    return res.json({ 
      success: true, 
      data: { categories: fallbackCategories } 
    });
  }
});

// GET /api/categories/:id
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id || isNaN(Number(req.params.id))) {
      return res.status(400).json({ success: false, error: 'Invalid category ID' });
    }

    // Check if Categories table exists
    const categoryTableExists = await checkCategoryTable();
    
    if (!categoryTableExists) {
      // Return fallback category if table doesn't exist
      const fallbackCategories = [
        { id: 1, name: 'Smartphones', Products: [] },
        { id: 2, name: 'Accessories', Products: [] },
        { id: 3, name: 'Wearables', Products: [] },
        { id: 4, name: 'Audio', Products: [] }
      ];
      
      const category = fallbackCategories.find(c => c.id === parseInt(req.params.id));
      
      if (!category) {
        return res.status(404).json({ success: false, error: 'Category not found' });
      }
      
      // Get products that might have this category in their category field
      const products = await db.Product.findAll({
        where: {
          category: category.name
        }
      });
      
      category.Products = products;
      
      return res.json({ success: true, data: { category } });
    }
    
    // Get category with products from the database
    const category = await db.Category.findByPk(req.params.id, {
      include: [
        { 
          model: db.Product,
          through: { attributes: [] }
        }
      ]
    });
    
    if (!category) {
      return res.status(404).json({ success: false, error: 'Category not found' });
    }
    
    return res.json({ success: true, data: { category } });
  } catch (e) {
    console.error('Error fetching category:', e.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch category' });
  }
});

export default router;
