// JWT auth helpers: parse token from cookie or Authorization header; attach req.user; simple admin gate.
import jwt from 'jsonwebtoken';
import db from '../models/index.js';

export async function authRequired(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = req.cookies?.token || bearer;
    if (!token) return res.status(401).json({ success: false, error: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    // Load user to ensure still exists and to get role
    const user = await db.User.findByPk(payload.id);
    if (!user) return res.status(401).json({ success: false, error: 'Unauthorized' });
    req.user = { id: user.id, role: user.role };
    return next();
  } catch {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
}

export function adminRequired(req, res, next) {
  if (req.user?.role !== 'admin') return res.status(403).json({ success: false, error: 'Forbidden' });
  return next();
}

export function sellerRequired(req, res, next) {
  if (req.user?.role !== 'admin' && req.user?.role !== 'seller') {
    return res.status(403).json({ success: false, error: 'Forbidden' });
  }
  return next();
}

export function apiKeyAuth(req, res, next) {
  const apiKey = req.headers['x-api-key'];
  
  if (!apiKey) {
    return res.status(401).json({ success: false, error: 'API key required' });
  }
  
  db.Seller.findOne({ where: { api_key: apiKey, status: 'active' } })
    .then(seller => {
      if (!seller) {
        return res.status(401).json({ success: false, error: 'Invalid API key' });
      }
      
      // Attach seller info to request
      req.seller = seller;
      next();
    })
    .catch(err => {
      console.error('API key auth error:', err);
      return res.status(500).json({ success: false, error: 'Authentication error' });
    });
}
