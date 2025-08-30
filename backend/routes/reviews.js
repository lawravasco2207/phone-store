// Reviews endpoints: list and create.
import express from 'express';
import db from '../models/index.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// GET /api/reviews/:productId
router.get('/:productId', async (req, res) => {
  try {
    const rows = await db.Review.findAll({ 
      where: { product_id: req.params.productId }, 
      include: [{ model: db.User, attributes: ['id', 'name'] }] 
    });
    return res.json({ success: true, data: { reviews: rows } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to load reviews' });
  }
});

// POST /api/reviews/:productId
router.post('/:productId', authRequired, async (req, res) => {
  try {
    const { rating, comment } = req.body || {};
    if (!rating || rating < 1 || rating > 5) return res.status(400).json({ success: false, error: 'rating 1-5 required' });
    const r = await db.Review.create({ product_id: req.params.productId, user_id: req.user.id, rating, comment });
    return res.status(201).json({ success: true, data: r });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to post review' });
  }
});

export default router;
