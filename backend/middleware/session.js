import crypto from 'crypto';
import db from '../models/index.js';

// Generate a URL-safe random ID
function generateId(prefix = 'sess_') {
  return prefix + crypto.randomBytes(12).toString('hex');
}

export async function sessionMiddleware(req, res, next) {
  try {
    // Prefer explicit header, then cookie
    let sessionId = req.headers['x-session-id'] || req.cookies?.sid || null;
    if (!sessionId || typeof sessionId !== 'string') {
      sessionId = generateId();
    }

    // Persist or find the ChatSession
    let chatSession = await db.ChatSession.findOne({ where: { session_id: sessionId } });
    if (!chatSession) {
      chatSession = await db.ChatSession.create({ session_id: sessionId });
    }

    // Attach to request for downstream usage
    req.sessionId = sessionId;
    req.chatSession = chatSession;

    // Set cookie if missing/outdated (non-HTTPOnly so frontend can read in SPA; secure in prod)
    const isProd = process.env.NODE_ENV === 'production';
    res.cookie('sid', sessionId, {
      httpOnly: false,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd,
      maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
      path: '/',
    });

    next();
  } catch (err) {
    console.error('sessionMiddleware error', err);
    next();
  }
}

export default sessionMiddleware;
