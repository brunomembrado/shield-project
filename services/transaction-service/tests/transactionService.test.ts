/**
 * Unit Tests for Transaction Service
 */

import {
  createTransaction,
  getUserTransactions,
  getTransactionById,
  updateTransactionStatus,
  getTransactionStats,
} from '../src/transactionService';
import prisma from '../src/database';
import {
  ServiceError,
  NotFoundError,
  AuthorizationError,
  ChainType,
  TransactionStatus,
} from '../../../shared/types';

// Mock Prisma
jest.mock('../src/database', () => ({
  __esModule: true,
  default: {
    transaction: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
    },
  },
}));

// Mock axios
jest.mock('axios', () => ({
  get: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Transaction Service', () => {
  const mockUserId = 'user-123';
  const mockTransactionId = 'transaction-123';

  beforeEach(() => {
    jest.clearAllMocks();
    process.env.SERVICE_FEE_PERCENTAGE = '1';
  });

  describe('createTransaction', () => {
    it('should create a transaction successfully', async () => {
      const transactionData = {
        walletId: 'wallet-123',
        chain: ChainType.POLYGON,
        amountUSDT: '100.0',
        bankAccountName: 'John Doe',
        bankAccountNumber: '1234567890',
        bankRoutingNumber: '123456789',
      };

      const mockTransaction = {
        id: mockTransactionId,
        userId: mockUserId,
        ...transactionData,
        toAddress: 'SHIELD_WALLET_ADDRESS',
        amountUSD: '100.00',
        exchangeRate: '1.0',
        serviceFeePercentage: '1',
        serviceFee: '1.00',
        netAmount: '99.00',
        status: TransactionStatus.PENDING,
        bankRoutingNumber: '123456789',
        txHash: null,
        bankWireReference: null,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.transaction.create.mockResolvedValue(mockTransaction as any);

      const axios = require('axios');
      axios.get.mockResolvedValue({ data: { tether: { usd: 1.0 } } });

      const result = await createTransaction(mockUserId, transactionData);

      expect(result).toEqual(mockTransaction);
      expect(mockPrisma.transaction.create).toHaveBeenCalled();
    });

    it('should handle errors when creating transaction', async () => {
      const transactionData = {
        walletId: 'wallet-123',
        chain: ChainType.POLYGON,
        amountUSDT: '100.0',
        bankAccountName: 'John Doe',
        bankAccountNumber: '1234567890',
      };

      mockPrisma.transaction.create.mockRejectedValue(new Error('Database error'));

      await expect(createTransaction(mockUserId, transactionData)).rejects.toThrow(ServiceError);
    });
  });

  describe('getUserTransactions', () => {
    it('should retrieve user transactions successfully', async () => {
      const mockTransactions = [
        {
          id: mockTransactionId,
          userId: mockUserId,
          chain: ChainType.POLYGON,
          status: TransactionStatus.PENDING,
        },
      ];

      mockPrisma.transaction.findMany.mockResolvedValue(mockTransactions as any);
      mockPrisma.transaction.count.mockResolvedValue(1);

      const result = await getUserTransactions(mockUserId);

      expect(result.transactions).toEqual(mockTransactions);
      expect(result.pagination.total).toBe(1);
      expect(mockPrisma.transaction.findMany).toHaveBeenCalled();
    });

    it('should apply filters correctly', async () => {
      const filters = {
        chain: ChainType.POLYGON,
        status: TransactionStatus.PENDING,
        limit: 10,
        offset: 0,
      };

      mockPrisma.transaction.findMany.mockResolvedValue([]);
      mockPrisma.transaction.count.mockResolvedValue(0);

      await getUserTransactions(mockUserId, filters);

      expect(mockPrisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            userId: mockUserId,
            chain: ChainType.POLYGON,
            status: TransactionStatus.PENDING,
          }),
          take: 10,
          skip: 0,
        })
      );
    });
  });

  describe('getTransactionById', () => {
    it('should retrieve transaction by ID successfully', async () => {
      const mockTransaction = {
        id: mockTransactionId,
        userId: mockUserId,
        chain: ChainType.POLYGON,
        status: TransactionStatus.PENDING,
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);

      const result = await getTransactionById(mockTransactionId, mockUserId);

      expect(result).toEqual(mockTransaction);
    });

    it('should throw NotFoundError if transaction does not exist', async () => {
      mockPrisma.transaction.findUnique.mockResolvedValue(null);

      await expect(getTransactionById(mockTransactionId, mockUserId)).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthorizationError if user does not own transaction', async () => {
      const mockTransaction = {
        id: mockTransactionId,
        userId: 'other-user',
        chain: ChainType.POLYGON,
        status: TransactionStatus.PENDING,
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);

      await expect(getTransactionById(mockTransactionId, mockUserId)).rejects.toThrow(AuthorizationError);
    });
  });

  describe('updateTransactionStatus', () => {
    it('should update transaction status successfully', async () => {
      const mockTransaction = {
        id: mockTransactionId,
        userId: mockUserId,
        status: TransactionStatus.PENDING,
        txHash: null,
        bankWireReference: null,
        notes: null,
      };

      const updateData = {
        status: TransactionStatus.PAYMENT_RECEIVED,
        txHash: '0x123',
      };

      const updatedTransaction = {
        ...mockTransaction,
        status: TransactionStatus.PAYMENT_RECEIVED,
        txHash: '0x123',
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);
      mockPrisma.transaction.update.mockResolvedValue(updatedTransaction as any);

      const result = await updateTransactionStatus(mockTransactionId, mockUserId, updateData);

      expect(result.status).toBe(TransactionStatus.PAYMENT_RECEIVED);
      expect(mockPrisma.transaction.update).toHaveBeenCalled();
    });

    it('should throw error for invalid status transition', async () => {
      const mockTransaction = {
        id: mockTransactionId,
        userId: mockUserId,
        status: TransactionStatus.WIRE_PROCESSED,
        txHash: null,
        bankWireReference: null,
        notes: null,
      };

      const updateData = {
        status: TransactionStatus.PENDING,
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);

      await expect(
        updateTransactionStatus(mockTransactionId, mockUserId, updateData)
      ).rejects.toThrow(ServiceError);
    });

    it('should throw AuthorizationError if user does not own transaction', async () => {
      const mockTransaction = {
        id: mockTransactionId,
        userId: 'other-user',
        status: TransactionStatus.PENDING,
        txHash: null,
        bankWireReference: null,
        notes: null,
      };

      const updateData = {
        status: TransactionStatus.PAYMENT_RECEIVED,
      };

      mockPrisma.transaction.findUnique.mockResolvedValue(mockTransaction as any);

      await expect(
        updateTransactionStatus(mockTransactionId, mockUserId, updateData)
      ).rejects.toThrow(AuthorizationError);
    });
  });

  describe('getTransactionStats', () => {
    it('should retrieve transaction statistics successfully', async () => {
      mockPrisma.transaction.count
        .mockResolvedValueOnce(10) // total
        .mockResolvedValueOnce(2) // pending
        .mockResolvedValueOnce(5) // completed
        .mockResolvedValueOnce(3) // polygon
        .mockResolvedValueOnce(7) // tron
        .mockResolvedValueOnce(2) // pending status
        .mockResolvedValueOnce(1) // paymentReceived
        .mockResolvedValueOnce(3) // approved
        .mockResolvedValueOnce(5) // wireProcessed
        .mockResolvedValueOnce(0) // failed
        .mockResolvedValueOnce(0); // rejected

      mockPrisma.transaction.aggregate
        .mockResolvedValueOnce({ _sum: { amountUSD: '1000.00' } } as any)
        .mockResolvedValueOnce({ _sum: { serviceFee: '10.00' } } as any);

      const result = await getTransactionStats(mockUserId);

      expect(result.total).toBe(10);
      expect(result.pending).toBe(2);
      expect(result.completed).toBe(5);
      expect(result.totalVolumeUSD).toBe('1000.00');
      expect(result.totalFees).toBe('10.00');
    });
  });
});

