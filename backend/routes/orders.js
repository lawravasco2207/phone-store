// Orders history/endpoints (user scope)
import express from 'express';
import db from '../models/index.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

router.use(authRequired);

// GET /api/orders
router.get('/', async (req, res) => {
  try {
    const rows = await db.Order.findAll({ where: { user_id: req.user.id }, include: [db.OrderItem], order: [['createdAt', 'DESC']] });
    return res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to load orders' });
  }
});

export default router;
