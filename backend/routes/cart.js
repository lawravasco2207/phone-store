// Cart endpoints (authenticated-only)
import express from 'express';
import db from '../models/index.js';
import { authRequired } from '../middleware/auth.js';
import { getCart, addToCart, updateCartItem, removeCartItem } from '../services/cartService.js';
import { subscribeToCart, emitCartChanged } from '../utils/sse.js';

const router = express.Router();

// Require auth for all cart routes
router.use(authRequired);

// GET /api/cart/stream - Server-Sent Events subscription for real-time cart changes
router.get('/stream', async (req, res) => {
  try {
    // Reuse authRequired so req.user is available
    subscribeToCart(req.user.id, res);
  } catch (e) {
    console.error('SSE subscribe error:', e);
    res.status(500).end();
  }
});

// GET /api/cart
router.get('/', async (req, res) => {
  try {
  const items = await getCart(req.user.id);
  return res.json({ success: true, data: { items } });
  } catch (e) {
    console.error('Error fetching cart:', e);
    return res.status(500).json({ success: false, error: 'Failed to fetch cart' });
  }
});

// POST /api/cart
router.post('/', async (req, res) => {
  try {
    const { product_id, productId, quantity = 1 } = req.body || {};
    // Allow either product_id or productId (for frontend compatibility)
    const finalProductId = product_id || productId;
    
    if (!finalProductId) {
      return res.status(400).json({ success: false, error: 'product_id required' });
    }
  const item = await addToCart(req.user.id, finalProductId, Number(quantity));
  // Notify other tabs/devices
  emitCartChanged(req.user.id, req.sessionId);
  return res.status(201).json({ success: true, data: { item } });
  } catch (e) {
    console.error('Cart error:', e);
    // Provide more detailed error information
    const errorMessage = e.message || 'Failed to add item';
    return res.status(500).json({ 
      success: false, 
      error: errorMessage
    });
  }
});

// PATCH /api/cart/:itemId
router.patch('/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body || {};
    if (quantity <= 0) {
      const removed = await removeCartItem(req.params.itemId, req.user.id);
      if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
    // Notify other tabs/devices
    emitCartChanged(req.user.id, req.sessionId);
    return res.json({ success: true });
    }

  const updated = await updateCartItem(req.params.itemId, req.user.id, Number(quantity));
  // Notify other tabs/devices
  emitCartChanged(req.user.id, req.sessionId);
  return res.json({ success: true, data: { item: updated } });
  } catch (e) {
    console.error('Error updating cart item:', e);
    return res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', async (req, res) => {
  try {
  const removed = await removeCartItem(req.params.itemId, req.user.id);
  if (!removed) return res.status(404).json({ success: false, error: 'Not found' });
  // Notify other tabs/devices
  emitCartChanged(req.user.id, req.sessionId);
  return res.json({ success: true });
  } catch (e) {
    console.error('Error removing cart item:', e);
    return res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
});

export default router;
