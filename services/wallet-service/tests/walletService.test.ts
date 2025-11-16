/**
 * Wallet Service Unit Tests
 */

import * as walletService from '../src/walletService';
import prisma from '../src/database';
import { ChainType, ConflictError, NotFoundError, AuthorizationError } from '../../../shared/types';

jest.mock('../src/database', () => ({
  __esModule: true,
  default: {
    wallet: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('Wallet Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createWallet', () => {
    it('should successfully create a new wallet', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        tag: 'Main Wallet',
        chain: ChainType.POLYGON,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(null);
      (prisma.wallet.create as jest.Mock).mockResolvedValue(mockWallet);

      const result = await walletService.createWallet('user-123', {
        tag: 'Main Wallet',
        chain: ChainType.POLYGON,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      });

      expect(result).toEqual(mockWallet);
      expect(prisma.wallet.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictError if wallet already exists', async () => {
      const existingWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        chain: ChainType.POLYGON,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        isActive: true,
      };

      (prisma.wallet.findFirst as jest.Mock).mockResolvedValue(existingWallet);

      await expect(
        walletService.createWallet('user-123', {
          chain: ChainType.POLYGON,
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        })
      ).rejects.toThrow(ConflictError);

      expect(prisma.wallet.create).not.toHaveBeenCalled();
    });
  });

  describe('getUserWallets', () => {
    it('should retrieve all wallets for a user', async () => {
      const mockWallets = [
        {
          id: 'wallet-1',
          userId: 'user-123',
          chain: ChainType.POLYGON,
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          isActive: true,
        },
        {
          id: 'wallet-2',
          userId: 'user-123',
          chain: ChainType.TRON,
          address: 'TR7NHqjeKQxGTCi8q8ZY4pL8otSzgjLj6t',
          isActive: true,
        },
      ];

      (prisma.wallet.findMany as jest.Mock).mockResolvedValue(mockWallets);

      const result = await walletService.getUserWallets('user-123');

      expect(result).toEqual(mockWallets);
      expect(result.length).toBe(2);
    });

    it('should filter wallets by chain', async () => {
      const mockWallets = [
        {
          id: 'wallet-1',
          userId: 'user-123',
          chain: ChainType.POLYGON,
          address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
          isActive: true,
        },
      ];

      (prisma.wallet.findMany as jest.Mock).mockResolvedValue(mockWallets);

      const result = await walletService.getUserWallets('user-123', {
        chain: ChainType.POLYGON,
      });

      expect(result).toEqual(mockWallets);
      expect(prisma.wallet.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ chain: ChainType.POLYGON }),
        })
      );
    });
  });

  describe('getWalletById', () => {
    it('should retrieve a wallet by ID', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        chain: ChainType.POLYGON,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        isActive: true,
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      const result = await walletService.getWalletById('wallet-123', 'user-123');

      expect(result).toEqual(mockWallet);
    });

    it('should throw NotFoundError if wallet does not exist', async () => {
      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        walletService.getWalletById('nonexistent', 'user-123')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError if wallet belongs to different user', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'other-user',
        chain: ChainType.POLYGON,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        isActive: true,
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);

      await expect(
        walletService.getWalletById('wallet-123', 'user-123')
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('updateWallet', () => {
    it('should successfully update a wallet', async () => {
      const existingWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        tag: 'Old Tag',
        chain: ChainType.POLYGON,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        isActive: true,
      };

      const updatedWallet = {
        ...existingWallet,
        tag: 'New Tag',
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(existingWallet);
      (prisma.wallet.update as jest.Mock).mockResolvedValue(updatedWallet);

      const result = await walletService.updateWallet('wallet-123', 'user-123', {
        tag: 'New Tag',
      });

      expect(result.tag).toBe('New Tag');
      expect(prisma.wallet.update).toHaveBeenCalledTimes(1);
    });
  });

  describe('deleteWallet', () => {
    it('should successfully delete a wallet', async () => {
      const mockWallet = {
        id: 'wallet-123',
        userId: 'user-123',
        chain: ChainType.POLYGON,
        address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
        isActive: true,
      };

      (prisma.wallet.findUnique as jest.Mock).mockResolvedValue(mockWallet);
      (prisma.wallet.delete as jest.Mock).mockResolvedValue(mockWallet);

      const result = await walletService.deleteWallet('wallet-123', 'user-123');

      expect(result.message).toBe('Wallet deleted successfully');
      expect(prisma.wallet.delete).toHaveBeenCalledTimes(1);
    });
  });
});

