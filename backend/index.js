// Minimal Express app wiring all API routes and middlewares.
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import cookieParser from 'cookie-parser';

// DB init (ensures models are registered/associations built)
import db from './models/index.js';

// Routers
import { sessionMiddleware } from './middleware/session.js';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import categoriesRouter from './routes/categories.js';
import searchRouter from './routes/search.js';
import adminRouter from './routes/admin.js';
import cartRouter from './routes/cart.js';
import checkoutRouter from './routes/checkout.js';
import reviewsRouter from './routes/reviews.js';
import supportRouter from './routes/support.js';
import ordersRouter from './routes/orders.js';
import integrationRouter from './routes/integration.js';
import aiRouter from './routes/ai.js';
import paymentsRouter from './routes/payments.js';
import assistRouter from './routes/assist/index.js';
import supportAssistRouter from './routes/assist.js';

const app = express();

// Basic hardening + JSON/cookies
app.use(helmet());

// Robust CORS setup with allowlist, wildcard support, and preflight handling
const rawOrigins = process.env.CORS_ORIGIN || process.env.CORS_ORIGINS || process.env.FRONTEND_URL || '';
const envOrigins = rawOrigins
    .split(',')
    .map(o => o && o.trim())
    .filter(Boolean);
// Always include localhost for dev
const defaultDevOrigins = ['http://localhost:5173', 'http://127.0.0.1:5173'];
const allowlist = Array.from(new Set([...envOrigins, ...defaultDevOrigins]));

// Allow common hosting suffixes by default (can be overridden via CORS_WILDCARD_ORIGINS)
const wildcardSuffixes = (process.env.CORS_WILDCARD_ORIGINS || 'onrender.com,vercel.app,netlify.app,github.io')
    .split(',')
    .map(s => s && s.trim())
    .filter(Boolean);

function originMatchesWildcard(origin) {
    try {
        const { hostname } = new URL(origin);
        return wildcardSuffixes.some(suffix => hostname === suffix || hostname.endsWith(`.${suffix}`));
    } catch {
        return false;
    }
}

// If not explicitly strict, run in permissive mode to avoid blocking frontends unintentionally
const permissive = (process.env.CORS_MODE || 'permissive') !== 'strict';

const corsOptions = {
    origin(origin, callback) {
        // Allow non-browser requests (no Origin header)
        if (!origin) return callback(null, true);
        if (allowlist.includes(origin) || originMatchesWildcard(origin)) {
            return callback(null, true);
        }
        if (permissive) {
            // Reflect any origin in permissive mode to avoid CORS blocks in prod
            return callback(null, true);
        }
        return callback(new Error(`CORS not allowed from origin: ${origin}`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'X-Session-Id'],
    optionsSuccessStatus: 200, // ensure browsers accept the preflight
};

app.use(cors(corsOptions));

// Helper to compute allowed origin string
function computeAllowedOrigin(originHeader) {
    if (!originHeader) return '';
    if (allowlist.includes(originHeader) || originMatchesWildcard(originHeader) || permissive) {
        return originHeader;
    }
    return '';
}

// Global CORS headers (helps for 404/errors and any path); keep in sync with corsOptions
app.use((req, res, next) => {
    const originHeader = req.headers.origin;
    const allowed = computeAllowedOrigin(originHeader);
    if (allowed) {
        res.setHeader('Access-Control-Allow-Origin', allowed);
        res.setHeader('Vary', 'Origin');
        res.setHeader('Access-Control-Allow-Credentials', 'true');
        res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
        res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, X-Session-Id');
        res.setHeader('Access-Control-Max-Age', '600');
    }
    if (req.method === 'OPTIONS') {
        // Send no-content but with headers so browser accepts
        return res.status(204).end();
    }
    next();
});
app.use(express.json());
app.use(cookieParser());
// Session must come after cookies so it can read sid
app.use(sessionMiddleware);

// Health check
app.get('/health', (_req, res) => res.json({ success: true, data: 'ok' }));

// Mount feature routers under /api to avoid clashes with frontend
app.use('/api/assist', assistRouter);
app.use('/api/support/assist', supportAssistRouter);
app.use('/api/auth', authRouter);
app.use('/api/products/search', searchRouter);
app.use('/api/products', productsRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/support', supportRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/integration', integrationRouter);
app.use('/api/ai', aiRouter);
app.use('/api/payments', paymentsRouter);

// Serve uploaded files
app.use('/uploads', express.static('uploads'));

// Fallback 404
app.use((req, res) => res.status(404).json({ success: false, error: 'Not found' }));

// Only start server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    const PORT = process.env.PORT || 3000;
    (async () => {
        try {
            await db.sequelize.authenticate();
            if (process.env.AUTO_SYNC === 'true') {
                await db.sequelize.sync({ alter: true });
                console.log('DB synced (alter)');
            }
            console.log('DB connected');
            
            // Set up HTTP server for socket.io
            const http = await import('http');
            const server = http.createServer(app);
            
            // Set up Socket.IO
            const { Server } = await import('socket.io');
            const io = new Server(server, {
                cors: corsOptions,
                path: '/socket.io'
            });
            
            // Set up namespaces
            const assistNamespace = io.of('/assist');
            
            // Handle AI assistant connections
            assistNamespace.on('connection', (socket) => {
                console.log('Client connected to AI assistant namespace', socket.id);
                
                // Join a session room
                socket.on('join', (sessionId) => {
                    if (sessionId) {
                        socket.join(sessionId);
                        console.log(`Client joined session: ${sessionId}`);
                    }
                });
                
                // Handle disconnect
                socket.on('disconnect', () => {
                    console.log('Client disconnected from AI assistant namespace', socket.id);
                });
            });
            
            // Start the server
            server.listen(PORT, () => console.log(`API listening on :${PORT}`));
        } catch (e) {
            console.error('DB connect error', e.message);
        }
    })();
}

export default app;