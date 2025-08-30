// Auth routes: email/password + Google OAuth (minimal), email verification, JWT cookie issuance.
import express from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import jwt from 'jsonwebtoken';
import db from '../models/index.js';
import { sendVerificationEmail } from '../utils/mailer.js';
import { writeAudit } from '../utils/audit.js';

const router = express.Router();

function issueJwt(res, user) {
  const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET || 'dev_secret', { expiresIn: '7d' });
  // HttpOnly cookie; frontend reads minimal user from response
  res.cookie('token', token, { httpOnly: true, sameSite: 'lax', secure: !!process.env.COOKIE_SECURE });
}

// POST /register
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body || {};
    if (!name || !email || !password) return res.status(400).json({ success: false, error: 'Missing fields' });
    const exists = await db.User.findOne({ where: { email } });
    if (exists) return res.status(409).json({ success: false, error: 'Email already registered' });
    const passwordHash = await bcrypt.hash(password, 10);
    const user = await db.User.create({ name, email, passwordHash, role: 'user', emailVerified: false });
    // create verification token (1 day)
    const token = crypto.randomBytes(32).toString('hex');
    await db.VerificationToken.create({ user_id: user.id, token, type: 'email_verify', expiresAt: new Date(Date.now() + 24*60*60*1000) });
    
        // Try to send verification email, but don't fail registration if email fails
    try {
      console.log('Attempting to send verification email to:', email);
      await sendVerificationEmail(email, token);
      console.log('Verification email sent successfully');
    } catch (emailError) {
      console.warn('Email sending failed during registration:', emailError.message);
      console.error('Full email error:', emailError);
      // Continue with registration even if email fails
    }
    
    await writeAudit(user.id, 'register', 'Users', user.id);
    return res.status(201).json({ success: true, data: { id: user.id, email: user.email } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Registration failed' });
  }
});

// POST /login
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body || {};
    const user = await db.User.findOne({ where: { email } });
    if (!user) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    const ok = await bcrypt.compare(password || '', user.passwordHash);
    if (!ok) return res.status(401).json({ success: false, error: 'Invalid credentials' });
    if (!user.emailVerified) return res.status(403).json({ success: false, error: 'Please verify your email' });
    user.lastLogin = new Date(); await user.save();
    issueJwt(res, user);
    await writeAudit(user.id, 'login', 'Users', user.id);
    return res.json({ success: true, data: { user: { id: user.id, name: user.name, role: user.role } } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Login failed' });
  }
});

// GET /verify-email
router.get('/verify-email', async (req, res) => {
  try {
    const token = req.query.token;
    if (!token) return res.status(400).json({ success: false, error: 'Missing token' });
    const vt = await db.VerificationToken.findOne({ where: { token, type: 'email_verify' }, include: [db.User] });
    if (!vt || vt.expiresAt < new Date()) return res.status(400).json({ success: false, error: 'Invalid token' });
    vt.User.emailVerified = true; await vt.User.save();
    await vt.destroy();
    await writeAudit(vt.User.id, 'verify_email', 'Users', vt.User.id);
    const redirectTo = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/verified`;
    return res.redirect(302, redirectTo);
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Verification failed' });
  }
});

// Google OAuth minimal: accept id_token from frontend (PKCE/OAuth handled there) or start flow (optional)
router.post('/google', async (req, res) => {
  // For simplicity, we accept an email from a verified Google token (frontend responsibility in this minimal setup).
  try {
    const { email, name } = req.body || {};
    if (!email) return res.status(400).json({ success: false, error: 'Email required' });
    let user = await db.User.findOne({ where: { email } });
    if (!user) {
      user = await db.User.create({ name: name || email.split('@')[0], email, passwordHash: await bcrypt.hash(crypto.randomBytes(8).toString('hex'), 10), emailVerified: false });
      await writeAudit(user.id, 'google_register', 'Users', user.id);
    }
    // Still require email verification for consistency
    if (!user.emailVerified) {
      const token = crypto.randomBytes(32).toString('hex');
      await db.VerificationToken.create({ user_id: user.id, token, type: 'email_verify', expiresAt: new Date(Date.now() + 24*60*60*1000) });
      await sendVerificationEmail(user.email, token);
      return res.status(202).json({ success: true, data: { needsVerification: true } });
    }
    issueJwt(res, user);
    await writeAudit(user.id, 'google_login', 'Users', user.id);
    return res.json({ success: true, data: { user: { id: user.id, name: user.name, role: user.role } } });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ success: false, error: 'Google auth failed' });
  }
});

// GET /me - Get current user info
router.get('/me', async (req, res) => {
  try {
    const token = req.cookies.token || req.headers.authorization?.replace('Bearer ', '');
    if (!token) return res.status(401).json({ success: false, error: 'Not authenticated' });
    
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'dev_secret');
    const user = await db.User.findByPk(decoded.id);
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });
    
    return res.json({ 
      success: true, 
      data: { 
        id: user.id, 
        name: user.name, 
        email: user.email, 
        role: user.role, 
        emailVerified: user.emailVerified 
      } 
    });
  } catch (e) {
    return res.status(401).json({ success: false, error: 'Invalid token' });
  }
});

// POST /logout
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  return res.json({ success: true });
});

export default router;
