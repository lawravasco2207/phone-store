// Public product APIs: list with filters/pagination and fetch by id.
import express from 'express';
import db from '../models/index.js';
import expressPkg from 'express';

const router = express.Router();

// Lightweight routes index for AI awareness (only this router's routes)
router.get('/__routes', (_req, res) => {
  return res.json({ success: true, data: [
    'GET /api/products',
    'GET /api/products/:id',
    'GET /api/products/search',
    'GET /api/categories',
    'GET /api/products/__routes'
  ]});
});

// GET /api/categories
router.get('/categories', async (req, res) => {
  try {
    const categories = await db.Category.findAll({
      order: [['name', 'ASC']]
    });
    
    return res.json({ 
      success: true, 
      data: { categories } 
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch categories' });
  }
});

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10, 
      category, 
      sort = 'createdAt', 
      order = 'desc', 
      search,
      featured
    } = req.query;
    const offset = (page - 1) * limit;
    
    // Check if Category model is available and categories table exists
    let useCategoryAssociation = false;
    try {
      if (db.Category) {
        const [tableCheck] = await db.sequelize.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Categories')"
        );
        useCategoryAssociation = tableCheck[0].exists;
      }
    } catch (err) {
      console.log("Association check failed:", err.message);
    }
    
    // Build filter conditions
    let where = {};
    let include = [];
    
    // Featured products filter
    if (featured === 'true') {
      where = {
        ...where,
        featured: true
      };
    }
    
        // Search condition if provided
        if (search) {
          where = {
            ...where,
            [Op.or]: [
              { name: { [Op.iLike]: `%${search}%` } },
              { description: { [Op.iLike]: `%${search}%` } }
            ]
          };
        }
    
        // Add Category association if available and filter by category
        if (useCategoryAssociation) {
          if (category) {
            include.push({
              model: db.Category,
              where: { name: category }
            });
          } else {
            include.push({ model: db.Category });
          }
        }
    
        // Query products with filters, pagination, and sorting
        const { Op } = db.Sequelize;
        const products = await db.Product.findAndCountAll({
          where,
          include,
          limit: parseInt(limit),
          offset: parseInt(offset),
          order: [[sort, order.toUpperCase() === 'DESC' ? 'DESC' : 'ASC']]
        });
    
        return res.json({
          success: true,
          data: {
            products: products.rows,
            total: products.count,
            page: parseInt(page),
            pages: Math.ceil(products.count / limit)
          }
        });
      } catch (e) {
        console.error(e);
        return res.status(500).json({ success: false, error: 'Failed to fetch products' });
      }
    });

// GET /api/products/featured
router.get('/featured', async (req, res) => {
  try {
    const { limit = 6 } = req.query;
    
    // Check if we have the featured column
    let hasFeaturedColumn = false;
    try {
      const [columnCheck] = await db.sequelize.query(
        "SELECT EXISTS (SELECT FROM information_schema.columns WHERE table_name = 'Products' AND column_name = 'featured')"
      );
      hasFeaturedColumn = columnCheck[0].exists;
    } catch (err) {
      console.log("Column check failed:", err.message);
    }
    
    // Check if Category model is available and categories table exists
    let useCategoryAssociation = false;
    try {
      if (db.Category) {
        const [tableCheck] = await db.sequelize.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Categories')"
        );
        useCategoryAssociation = tableCheck[0].exists;
      }
    } catch (err) {
      console.log("Association check failed:", err.message);
    }
    
    // Build query based on available columns
    let where = {};
    let include = [];
    
    // If we have the featured column, use it
    if (hasFeaturedColumn) {
      where.featured = true;
    }
    
    // Add Category association if available
    if (useCategoryAssociation) {
      include.push({ model: db.Category });
    }
    
    // If we don't have the featured column, we'll just pick random products
    const products = hasFeaturedColumn 
      ? await db.Product.findAll({
          where,
          include,
          limit: parseInt(limit),
          order: [['createdAt', 'DESC']]
        })
      : await db.Product.findAll({
          include,
          limit: parseInt(limit),
          order: db.sequelize.random()
        });
    
    return res.json({ 
      success: true, 
      data: { products } 
    });
  } catch (e) {
    console.error('Error fetching featured products:', e.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch featured products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id || isNaN(Number(req.params.id))) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    // Check if Category model is available and categories table exists
    let include = [];
    try {
      // Check if inventory is available
      if (db.Inventory) {
        const [inventoryCheck] = await db.sequelize.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Inventories')"
        );
        if (inventoryCheck[0].exists) {
          include.push({ model: db.Inventory });
        }
      }
      
      if (db.Category) {
        const [tableCheck] = await db.sequelize.query(
          "SELECT EXISTS (SELECT FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'Categories')"
        );
        if (tableCheck[0].exists) {
          include.push({ model: db.Category });
        }
      }
    } catch (err) {
      console.log("Association check failed:", err.message);
    }
    
    // Query product with optional associations
    const product = include.length > 0 
      ? await db.Product.findByPk(req.params.id, { include })
      : await db.Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Convert to plain object
    const formattedProduct = product.toJSON();
    
    // Add inventory value from related model or default
    formattedProduct.inventory = formattedProduct.Inventory?.stock_quantity || 10;
    
    // Ensure the product has an images array
    if (!formattedProduct.images || !Array.isArray(formattedProduct.images)) {
      formattedProduct.images = ['/api/placeholder/400/400'];
    }
    
    return res.json({ success: true, data: { product: formattedProduct } });
  } catch (e) {
    console.error('Error fetching product:', e.message);
    return res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

export default router;
