
import { describe, it, expect } from 'vitest';
import { checkFrontendHealth } from '../health';

describe('Frontend Health Check', () => {
  it('should return a success message', () => {
    const health = checkFrontendHealth();
    expect(health.success).toBe(true);
    expect(health.message).toBe('Frontend is healthy');
  });
});
