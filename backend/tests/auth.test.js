// Basic happy-path tests for register/login using supertest and vitest.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import app from '../index.js';
import db from '../models/index.js';

const email = `user_${Date.now()}@test.com`;

beforeAll(async () => {
  await db.sequelize.authenticate();
  await db.sequelize.sync({ force: true });
});

afterAll(async () => {
  await db.sequelize.close();
});

describe('auth', () => {
  it('registers a user', async () => {
    const res = await request(app).post('/api/auth/register').send({ name: 'Tester', email, password: 'secret123' });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it('rejects login before email verification', async () => {
    const res = await request(app).post('/api/auth/login').send({ email, password: 'secret123' });
    expect(res.status).toBe(403);
  });
});
