// Cart routes should require auth; verify 401 for guests and success for authed users
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

let user, token, product;

beforeAll(async () => {
  await db.sequelize.authenticate();
  await db.sequelize.sync({ force: true });
  user = await db.User.create({
    name: 'CartUser',
    email: `cart_${Date.now()}@t.com`,
    passwordHash: await bcrypt.hash('secret', 6),
    emailVerified: true,
  });
  token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET || 'dev_secret');
  product = await db.Product.create({ name: 'Cart Phone', price: 50 });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('cart auth', () => {
  it('rejects unauthenticated get cart', async () => {
    const res = await request(app).get('/api/cart');
    expect(res.status).toBe(401);
  });

  it('allows authenticated get cart (empty)', async () => {
    const res = await request(app).get('/api/cart').set('Authorization', `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.items)).toBe(true);
  });

  it('adds item when authenticated', async () => {
    const res = await request(app)
      .post('/api/cart')
      .set('Authorization', `Bearer ${token}`)
      .send({ product_id: product.id, quantity: 2 });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });
});
