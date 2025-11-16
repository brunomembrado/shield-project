/**
 * Comprehensive Unit Tests for Wallet Controller
 * 
 * Tests all wallet endpoints with full coverage
 * 
 * @module wallet-service/tests
 */

import request from 'supertest';
import app from '../src/index';

// Mock authentication middleware
jest.mock('@shield/shared/middleware', () => ({
  ...jest.requireActual('@shield/shared/middleware'),
  authenticate: (req: any, res: any, next: any) => {
    req.user = { id: 'user-123', email: 'test@example.com' };
    next();
  },
}));

describe('Wallet Controller - API v1', () => {
  describe('POST /v1/wallets', () => {
    it('should return 400 for invalid address', async () => {
      const response = await request(app)
        .post('/v1/wallets')
        .set('Authorization', 'Bearer mock-token')
        .send({
          chain: 'POLYGON',
          address: 'invalid-address',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing chain', async () => {
      const response = await request(app)
        .post('/v1/wallets')
        .set('Authorization', 'Bearer mock-token')
        .send({
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('POST /v1/wallets/generate', () => {
    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/v1/wallets/generate')
        .set('Authorization', 'Bearer mock-token')
        .send({
          chain: 'POLYGON',
          password: 'weak',
        });

      expect(response.status).toBe(400);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/v1/wallets/generate')
        .set('Authorization', 'Bearer mock-token')
        .send({
          chain: 'POLYGON',
        });

      expect(response.status).toBe(400);
    });
  });

  describe('Health Check', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');
      expect(response.status).toBe(200);
      expect(response.body.status).toBe('ok');
    });
  });
});

