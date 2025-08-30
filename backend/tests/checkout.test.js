// Minimal checkout test assumes there is at least one product and email-verified user.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

let user, product;

beforeAll(async () => {
  await db.sequelize.authenticate();
  await db.sequelize.sync({ force: true });
  // create verified user and product
  user = await db.User.create({ name: 'Buyer', email: `buyer_${Date.now()}@t.com`, passwordHash: await bcrypt.hash('x', 6), emailVerified: true });
  product = await db.Product.create({ name: 'Test Phone', price: 99.99, images: ['https://example.com/a.jpg'] });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('checkout', () => {
  it('creates order with mock payment', async () => {
    const token = jwt.sign({ id: user.id, role: 'user' }, process.env.JWT_SECRET || 'dev_secret');
    // add to cart
    await request(app).post('/api/cart').set('Authorization', `Bearer ${token}`).send({ product_id: product.id, quantity: 2 });
    const res = await request(app).post('/api/checkout').set('Authorization', `Bearer ${token}`).send({});
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.payment.status).toBe('completed');
  });
});
