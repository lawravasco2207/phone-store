// Cart endpoints using Sequelize models.
import express from 'express';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { authRequired } from '../middleware/auth.js';

const router = express.Router();

// Guest Cart Middleware - Checks if user is logged in, if not, uses a session-based cart
const guestCartMiddleware = async (req, res, next) => {
  try {
    // Extract token from cookies or Authorization header
    const header = req.headers.authorization || '';
    const bearer = header.startsWith('Bearer ') ? header.slice(7) : null;
    const token = req.cookies?.token || bearer;
    
    if (!token) {
      // Guest user - create a guest cart context
      req.isGuest = true;
      req.guestCartId = req.cookies?.guestCartId || Math.random().toString(36).substring(2, 15);
      // Set cookie for guest cart if not exists
      if (!req.cookies?.guestCartId) {
        res.cookie('guestCartId', req.guestCartId, { 
          maxAge: 30 * 24 * 60 * 60 * 1000, // 30 days
          httpOnly: true 
        });
      }
      return next();
    }
    
    try {
      // Verify token
      const payload = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
      const user = await db.User.findByPk(payload.id);
      
      if (!user) {
        req.isGuest = true;
        req.guestCartId = req.cookies?.guestCartId || Math.random().toString(36).substring(2, 15);
        return next();
      }
      
      // Authenticated user
      req.isGuest = false;
      req.user = { id: user.id, role: user.role };
      return next();
    } catch (error) {
      // Invalid token, treat as guest
      req.isGuest = true;
      req.guestCartId = req.cookies?.guestCartId || Math.random().toString(36).substring(2, 15);
      return next();
    }
  } catch (error) {
    console.error('Cart middleware error:', error);
    req.isGuest = true;
    req.guestCartId = req.cookies?.guestCartId || Math.random().toString(36).substring(2, 15);
    return next();
  }
};

// Use the guest cart middleware for all cart routes
router.use(guestCartMiddleware);

// GET /api/cart
router.get('/', async (req, res) => {
  try {
    if (req.isGuest) {
      // For guests, we'll return an empty cart since items are stored client-side
      return res.json({ 
        success: true, 
        data: { 
          items: [],
          isGuestCart: true
        } 
      });
    }
    
    // For logged in users, fetch from database
    const items = await db.CartItem.findAll({ 
      where: { user_id: req.user.id }, 
      include: [db.Product] 
    });
    
    return res.json({ 
      success: true, 
      data: { 
        items,
        isGuestCart: false
      } 
    });
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
    
    // For guest users, we'll simulate success but client handles storage
    if (req.isGuest) {
      // Verify the product exists
      const product = await db.Product.findByPk(finalProductId);
      if (!product) {
        return res.status(404).json({ success: false, error: 'Product not found' });
      }
      
      return res.status(200).json({ 
        success: true, 
        data: {
          isGuestCart: true,
          message: 'Item added to guest cart',
          product: product
        }
      });
    }
    
    // For logged in users
    const existing = await db.CartItem.findOne({ 
      where: { user_id: req.user.id, product_id: finalProductId } 
    });
    
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
      error: errorMessage
    });
  }
});

// PATCH /api/cart/:itemId
router.patch('/:itemId', async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json({ 
        success: true,
        data: {
          isGuestCart: true,
          message: 'Item updated in guest cart'
        }
      });
    }
    
    const item = await db.CartItem.findByPk(req.params.itemId);
    if (!item || item.user_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    
    const { quantity } = req.body || {};
    if (quantity <= 0) { 
      await item.destroy(); 
      return res.json({ success: true }); 
    }
    
    await item.update({ quantity });
    return res.json({ success: true, data: item });
  } catch (e) {
    console.error('Error updating cart item:', e);
    return res.status(500).json({ success: false, error: 'Failed to update item' });
  }
});

// DELETE /api/cart/:itemId
router.delete('/:itemId', async (req, res) => {
  try {
    if (req.isGuest) {
      return res.json({ 
        success: true,
        data: {
          isGuestCart: true,
          message: 'Item removed from guest cart'
        }
      });
    }
    
    const item = await db.CartItem.findByPk(req.params.itemId);
    if (!item || item.user_id !== req.user.id) {
      return res.status(404).json({ success: false, error: 'Not found' });
    }
    
    await item.destroy();
    return res.json({ success: true });
  } catch (e) {
    console.error('Error removing cart item:', e);
    return res.status(500).json({ success: false, error: 'Failed to remove item' });
  }
});

export default router;
