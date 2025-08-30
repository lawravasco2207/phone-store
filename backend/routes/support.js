// Support ticket endpoints.
import express from 'express';
import db from '../models/index.js';
import { authRequired, adminRequired } from '../middleware/auth.js';

const router = express.Router();

// User creates a ticket
router.post('/', authRequired, async (req, res) => {
  try {
    const { subject, message } = req.body || {};
    if (!subject || !message) return res.status(400).json({ success: false, error: 'subject and message required' });
    const ticket = await db.SupportTicket.create({ user_id: req.user.id, subject, message });
    return res.status(201).json({ success: true, data: { id: ticket.id } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to create ticket' });
  }
});

// Admin lists tickets
router.get('/', authRequired, adminRequired, async (req, res) => {
  try {
    const { status } = req.query;
    const where = status ? { status } : {};
    const rows = await db.SupportTicket.findAll({ where, include: [{ model: db.User, attributes: ['id', 'name', 'email'] }] });
    return res.json({ success: true, data: rows });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to load tickets' });
  }
});

// Admin updates status
router.patch('/:id', authRequired, adminRequired, async (req, res) => {
  try {
    const t = await db.SupportTicket.findByPk(req.params.id);
    if (!t) return res.status(404).json({ success: false, error: 'Not found' });
    const { status } = req.body || {};
    await t.update({ status });
    return res.json({ success: true });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Failed to update ticket' });
  }
});

export default router;
