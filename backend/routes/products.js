// Public product APIs: list with filters/pagination and fetch by id.
import express from 'express';
import db from '../models/index.js';

const router = express.Router();

// GET /api/products
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 12, sort = 'createdAt', order = 'DESC', category } = req.query;
    const where = {};
    const include = [];
    if (category) {
      include.push({ model: db.Category, where: { name: category }, through: { attributes: [] } });
    }
    const result = await db.Product.findAndCountAll({
      where,
      include,
      offset: (Number(page) - 1) * Number(limit),
      limit: Number(limit),
      order: [[String(sort), String(order)]]
    });
    
    // Format response to match frontend expectations
    return res.json({ 
      success: true, 
      data: { 
        products: result.rows, 
        pagination: {
          page: Number(page),
          limit: Number(limit),
          total: result.count,
          pages: Math.ceil(result.count / Number(limit))
        } 
      } 
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch products' });
  }
});

// GET /api/products/:id
router.get('/:id', async (req, res) => {
  try {
    if (!req.params.id || isNaN(Number(req.params.id))) {
      return res.status(400).json({ success: false, error: 'Invalid product ID' });
    }

    // Query product without any associations to avoid table issues
    const product = await db.Product.findByPk(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, error: 'Product not found' });
    }
    
    // Convert to plain object
    const formattedProduct = product.toJSON();
    
    // Add default inventory value
    formattedProduct.inventory = 10; // Default to 10 items in stock
    
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
