// Cart endpoints using Sequelize models.
import express from 'express';
import db from '../models/index.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

router.use(authRequired);

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    const items = await db.CartItem.findAll({ where: { user_id: req.user.id }, include: [db.Product] });
    return res.json({ success: true, data: items });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to fetch cart' });
  }
});

// POST /api/cart
router.post('/', async (req, res) => {
  try {
    const { product_id, productId, quantity = 1 } = req.body || {};
    // Allow either product_id or productId (for frontend compatibility)
    const finalProductId = product_id || productId;
    
    if (!finalProductId) return res.status(400).json({ success: false, error: 'product_id required' });
    
    const existing = await db.CartItem.findOne({ where: { user_id: req.user.id, product_id: finalProductId } });
    const item = existing
      ? await existing.update({ quantity: existing.quantity + Number(quantity) })
      : await db.CartItem.create({ user_id: req.user.id, product_id: finalProductId, quantity });
    
    return res.status(201).json({ success: true, data: item });
  } catch (e) {
    console.error('Cart error:', e);
    // Provide more detailed error information
    const errorMessage = e.message || 'Failed to add item';
    return res.status(500).json({ 
      success: false, 
      error: errorMessage,
      details: { 
        message: e.message,
        name: e.name,
        stack: process.env.NODE_ENV === 'development' ? e.stack : undefined
      }
    });
  }
});

// PATCH /api/cart/:itemId
router.patch('/:itemId', async (req, res) => {
  try {
    const item = await db.CartItem.findByPk(req.params.itemId);
    if (!item || item.user_id !== req.user.id) return res.status(404).json({ success: false, error: 'Not found' });
    const { quantity } = req.body || {};
    if (quantity <= 0) { await item.destroy(); return res.json({ success: true }); }
    await item.update({ quantity });
    return res.json({ success: true, data: item });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', async (req, res) => {
  try {
    const item = await db.CartItem.findByPk(req.params.itemId);
    if (!item || item.user_id !== req.user.id) return res.status(404).json({ success: false, error: 'Not found' });
    await item.destroy();
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
});

export default router;
