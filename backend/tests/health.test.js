
import { describe, it, expect } from 'vitest';
import { checkBackendHealth } from '../health.ts';

describe('Backend Health Check', () => {
  it('should return a success message when the database is connected', async () => {
    const health = await checkBackendHealth();
    expect(health.success).toBe(true);
    expect(health.message).toBe('Backend is healthy, DB connected');
  });
});
