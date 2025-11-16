/**
 * Unit Tests for Wallet Controller
 */

import request from 'supertest';
import app from '../src/index';
import * as walletService from '../src/walletService';
import { ServiceError, ChainType } from '../../../shared/types';

// Mock walletService
jest.mock('../src/walletService');

const mockWalletService = walletService as jest.Mocked<typeof walletService>;

describe('Wallet Controller', () => {
  const mockUserId = 'user-123';
  const mockToken = 'Bearer mock-jwt-token';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /wallets', () => {
    it('should create a wallet successfully', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: mockUserId,
        tag: 'My Polygon Wallet',
        chain: ChainType.POLYGON,
        address: '0x1234567890123456789012345678901234567890',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWalletService.createWallet.mockResolvedValue(mockWallet);

      const response = await request(app)
        .post('/wallets')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId)
        .send({
          tag: 'My Polygon Wallet',
          chain: 'POLYGON',
          address: '0x1234567890123456789012345678901234567890',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(expect.objectContaining({
        id: 'wallet-123',
        chain: 'POLYGON',
      }));
    });

    it('should return 400 for invalid Polygon address', async () => {
      const response = await request(app)
        .post('/wallets')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId)
        .send({
          chain: 'POLYGON',
          address: 'invalid-address',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for invalid Tron address', async () => {
      const response = await request(app)
        .post('/wallets')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId)
        .send({
          chain: 'TRON',
          address: '0x1234567890123456789012345678901234567890',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing chain', async () => {
      const response = await request(app)
        .post('/wallets')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId)
        .send({
          address: '0x1234567890123456789012345678901234567890',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing address', async () => {
      const response = await request(app)
        .post('/wallets')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId)
        .send({
          chain: 'POLYGON',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/wallets')
        .send({
          chain: 'POLYGON',
          address: '0x1234567890123456789012345678901234567890',
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /wallets', () => {
    it('should get all user wallets', async () => {
      const mockWallets = [
        {
          id: 'wallet-1',
          userId: mockUserId,
          chain: ChainType.POLYGON,
          address: '0x1234567890123456789012345678901234567890',
          tag: 'Wallet 1',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'wallet-2',
          userId: mockUserId,
          chain: ChainType.TRON,
          address: 'TAbcdef1234567890123456789012345678901',
          tag: 'Wallet 2',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWalletService.getUserWallets.mockResolvedValue(mockWallets);

      const response = await request(app)
        .get('/wallets')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveLength(2);
    });

    it('should filter wallets by chain', async () => {
      const mockWallets = [
        {
          id: 'wallet-1',
          userId: mockUserId,
          chain: ChainType.POLYGON,
          address: '0x1234567890123456789012345678901234567890',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ];

      mockWalletService.getUserWallets.mockResolvedValue(mockWallets);

      const response = await request(app)
        .get('/wallets?chain=POLYGON')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].chain).toBe('POLYGON');
    });

    it('should return empty array for user with no wallets', async () => {
      mockWalletService.getUserWallets.mockResolvedValue([]);

      const response = await request(app)
        .get('/wallets')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId);

      expect(response.status).toBe(200);
      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /wallets/:id', () => {
    it('should get wallet by id', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: mockUserId,
        chain: ChainType.POLYGON,
        address: '0x1234567890123456789012345678901234567890',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWalletService.getWalletById.mockResolvedValue(mockWallet);

      const response = await request(app)
        .get('/wallets/wallet-123')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe('wallet-123');
    });

    it('should return 404 for non-existent wallet', async () => {
      mockWalletService.getWalletById.mockRejectedValue(
        new ServiceError('Wallet not found', 404)
      );

      const response = await request(app)
        .get('/wallets/non-existent')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });

    it('should return 403 when accessing another user wallet', async () => {
      mockWalletService.getWalletById.mockRejectedValue(
        new ServiceError('You do not have permission', 403)
      );

      const response = await request(app)
        .get('/wallets/other-user-wallet')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId);

      expect(response.status).toBe(403);
      expect(response.body.success).toBe(false);
    });
  });

  describe('PUT /wallets/:id', () => {
    it('should update wallet successfully', async () => {
      const updatedWallet = {
        id: 'wallet-123',
        userId: mockUserId,
        chain: ChainType.POLYGON,
        address: '0x9999999999999999999999999999999999999999',
        tag: 'Updated Tag',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockWalletService.updateWallet.mockResolvedValue(updatedWallet);

      const response = await request(app)
        .put('/wallets/wallet-123')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId)
        .send({
          tag: 'Updated Tag',
          address: '0x9999999999999999999999999999999999999999',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.tag).toBe('Updated Tag');
    });

    it('should return 400 for invalid address on update', async () => {
      const response = await request(app)
        .put('/wallets/wallet-123')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId)
        .send({
          address: 'invalid-address',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('DELETE /wallets/:id', () => {
    it('should delete wallet successfully', async () => {
      mockWalletService.deleteWallet.mockResolvedValue(undefined);

      const response = await request(app)
        .delete('/wallets/wallet-123')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 404 when deleting non-existent wallet', async () => {
      mockWalletService.deleteWallet.mockRejectedValue(
        new ServiceError('Wallet not found', 404)
      );

      const response = await request(app)
        .delete('/wallets/non-existent')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId);

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /wallets/stats', () => {
    it('should get wallet statistics', async () => {
      const mockStats = {
        total: 5,
        byChain: {
          polygon: 3,
          tron: 2,
        },
        active: 5,
        inactive: 0,
      };

      mockWalletService.getWalletStats.mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/wallets/stats')
        .set('Authorization', mockToken)
        .set('x-user-id', mockUserId);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.total).toBe(5);
    });
  });
});

