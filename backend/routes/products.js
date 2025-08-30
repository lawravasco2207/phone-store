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
    const product = await db.Product.findByPk(req.params.id, { include: [db.Category, db.Inventory] });
    if (!product) return res.status(404).json({ success: false, error: 'Product not found' });
    return res.json({ success: true, data: { product } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch product' });
  }
});

export default router;
