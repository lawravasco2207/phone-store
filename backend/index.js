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
import chatRouter from './routes/chat.js';
import authRouter from './routes/auth.js';
import productsRouter from './routes/products.js';
import searchRouter from './routes/search.js';
import adminRouter from './routes/admin.js';
import cartRouter from './routes/cart.js';
import checkoutRouter from './routes/checkout.js';
import reviewsRouter from './routes/reviews.js';
import supportRouter from './routes/support.js';
import ordersRouter from './routes/orders.js';
import integrationRouter from './routes/integration.js';
import aiRouter from './routes/ai.js';

const app = express();

// Basic hardening + JSON/cookies
app.use(helmet());
app.use(cors({
    origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
    credentials: true,
}));
app.use(express.json());
app.use(cookieParser());
// Session must come after cookies so it can read sid
app.use(sessionMiddleware);

// Health check
app.get('/health', (_req, res) => res.json({ success: true, data: 'ok' }));

// Mount feature routers under /api to avoid clashes with frontend
app.use('/api/chat', chatRouter);
app.use('/api/auth', authRouter);
app.use('/api/products/search', searchRouter);
app.use('/api/products', productsRouter);
app.use('/api/admin', adminRouter);
app.use('/api/cart', cartRouter);
app.use('/api/checkout', checkoutRouter);
app.use('/api/reviews', reviewsRouter);
app.use('/api/support', supportRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/integration', integrationRouter);
app.use('/api/ai', aiRouter);

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
        } catch (e) {
            console.error('DB connect error', e.message);
        }
    })();
    app.listen(PORT, () => console.log(`API listening on :${PORT}`));
}

export default app;