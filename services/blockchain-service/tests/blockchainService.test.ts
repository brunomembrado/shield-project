/**
 * Unit Tests for Blockchain Service
 */

import * as polygonClient from '../src/polygonClient';
import * as tronClient from '../src/tronClient';
import { ChainType } from '../../../shared/types';

// Mock clients
jest.mock('../src/polygonClient');
jest.mock('../src/tronClient');

const mockPolygonClient = polygonClient as jest.Mocked<typeof polygonClient>;
const mockTronClient = tronClient as jest.Mocked<typeof tronClient>;

describe('Blockchain Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Polygon Client', () => {
    describe('getBlockNumber', () => {
      it('should get current block number', async () => {
        mockPolygonClient.getBlockNumber.mockResolvedValue(12345678);

        const blockNumber = await mockPolygonClient.getBlockNumber();

        expect(blockNumber).toBe(12345678);
        expect(mockPolygonClient.getBlockNumber).toHaveBeenCalled();
      });

      it('should handle RPC errors', async () => {
        mockPolygonClient.getBlockNumber.mockRejectedValue(
          new Error('RPC connection failed')
        );

        await expect(mockPolygonClient.getBlockNumber()).rejects.toThrow(
          'RPC connection failed'
        );
      });
    });

    describe('getUSDTBalance', () => {
      it('should get USDT balance for address', async () => {
        const address = '0x1234567890123456789012345678901234567890';
        mockPolygonClient.getUSDTBalance.mockResolvedValue('1000.500000');

        const balance = await mockPolygonClient.getUSDTBalance(address);

        expect(balance).toBe('1000.500000');
        expect(mockPolygonClient.getUSDTBalance).toHaveBeenCalledWith(address);
      });

      it('should return 0 for address with no balance', async () => {
        const address = '0x0000000000000000000000000000000000000000';
        mockPolygonClient.getUSDTBalance.mockResolvedValue('0.000000');

        const balance = await mockPolygonClient.getUSDTBalance(address);

        expect(balance).toBe('0.000000');
      });

      it('should handle invalid address', async () => {
        const invalidAddress = 'invalid-address';
        mockPolygonClient.getUSDTBalance.mockRejectedValue(
          new Error('Invalid address format')
        );

        await expect(
          mockPolygonClient.getUSDTBalance(invalidAddress)
        ).rejects.toThrow('Invalid address format');
      });
    });

    describe('getTransactions', () => {
      it('should get transactions for address', async () => {
        const address = '0x1234567890123456789012345678901234567890';
        const mockTxs = [
          {
            hash: '0xabc123',
            from: address,
            to: '0x9999999999999999999999999999999999999999',
            value: '100.000000',
            blockNumber: 12345678,
            timestamp: new Date(),
          },
        ];

        mockPolygonClient.getTransactions.mockResolvedValue(mockTxs);

        const transactions = await mockPolygonClient.getTransactions(address);

        expect(transactions).toHaveLength(1);
        expect(transactions[0].hash).toBe('0xabc123');
      });

      it('should return empty array for address with no transactions', async () => {
        const address = '0x0000000000000000000000000000000000000000';
        mockPolygonClient.getTransactions.mockResolvedValue([]);

        const transactions = await mockPolygonClient.getTransactions(address);

        expect(transactions).toHaveLength(0);
      });
    });
  });

  describe('Tron Client', () => {
    describe('getBlockNumber', () => {
      it('should get current block number', async () => {
        mockTronClient.getBlockNumber.mockResolvedValue(45678901);

        const blockNumber = await mockTronClient.getBlockNumber();

        expect(blockNumber).toBe(45678901);
        expect(mockTronClient.getBlockNumber).toHaveBeenCalled();
      });

      it('should handle Tron node errors', async () => {
        mockTronClient.getBlockNumber.mockRejectedValue(
          new Error('Tron node connection failed')
        );

        await expect(mockTronClient.getBlockNumber()).rejects.toThrow(
          'Tron node connection failed'
        );
      });
    });

    describe('getUSDTBalance', () => {
      it('should get USDT balance for Tron address', async () => {
        const address = 'TAbcdef1234567890123456789012345678901';
        mockTronClient.getUSDTBalance.mockResolvedValue('500.750000');

        const balance = await mockTronClient.getUSDTBalance(address);

        expect(balance).toBe('500.750000');
        expect(mockTronClient.getUSDTBalance).toHaveBeenCalledWith(address);
      });

      it('should return 0 for address with no balance', async () => {
        const address = 'TAbcdef1234567890123456789012345678901';
        mockTronClient.getUSDTBalance.mockResolvedValue('0.000000');

        const balance = await mockTronClient.getUSDTBalance(address);

        expect(balance).toBe('0.000000');
      });

      it('should handle invalid Tron address', async () => {
        const invalidAddress = '0x1234567890123456789012345678901234567890';
        mockTronClient.getUSDTBalance.mockRejectedValue(
          new Error('Invalid Tron address format')
        );

        await expect(
          mockTronClient.getUSDTBalance(invalidAddress)
        ).rejects.toThrow('Invalid Tron address format');
      });
    });

    describe('getTransactions', () => {
      it('should get transactions for Tron address', async () => {
        const address = 'TAbcdef1234567890123456789012345678901';
        const mockTxs = [
          {
            hash: 'tron_tx_hash_123',
            from: address,
            to: 'TXyz9876543210987654321098765432109876',
            value: '250.000000',
            blockNumber: 45678901,
            timestamp: new Date(),
          },
        ];

        mockTronClient.getTransactions.mockResolvedValue(mockTxs);

        const transactions = await mockTronClient.getTransactions(address);

        expect(transactions).toHaveLength(1);
        expect(transactions[0].hash).toBe('tron_tx_hash_123');
      });

      it('should return empty array for address with no transactions', async () => {
        const address = 'TAbcdef1234567890123456789012345678901';
        mockTronClient.getTransactions.mockResolvedValue([]);

        const transactions = await mockTronClient.getTransactions(address);

        expect(transactions).toHaveLength(0);
      });
    });
  });

  describe('Multi-chain operations', () => {
    it('should handle both Polygon and Tron operations', async () => {
      const polygonAddress = '0x1234567890123456789012345678901234567890';
      const tronAddress = 'TAbcdef1234567890123456789012345678901';

      mockPolygonClient.getUSDTBalance.mockResolvedValue('1000.000000');
      mockTronClient.getUSDTBalance.mockResolvedValue('500.000000');

      const polygonBalance = await mockPolygonClient.getUSDTBalance(
        polygonAddress
      );
      const tronBalance = await mockTronClient.getUSDTBalance(tronAddress);

      expect(polygonBalance).toBe('1000.000000');
      expect(tronBalance).toBe('500.000000');
    });

    it('should handle mixed success and failure scenarios', async () => {
      const polygonAddress = '0x1234567890123456789012345678901234567890';
      const tronAddress = 'invalid-tron-address';

      mockPolygonClient.getUSDTBalance.mockResolvedValue('1000.000000');
      mockTronClient.getUSDTBalance.mockRejectedValue(
        new Error('Invalid address')
      );

      const polygonBalance = await mockPolygonClient.getUSDTBalance(
        polygonAddress
      );
      
      expect(polygonBalance).toBe('1000.000000');
      await expect(
        mockTronClient.getUSDTBalance(tronAddress)
      ).rejects.toThrow('Invalid address');
    });
  });

  describe('Edge cases', () => {
    it('should handle very large balance amounts', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      mockPolygonClient.getUSDTBalance.mockResolvedValue('999999999.999999');

      const balance = await mockPolygonClient.getUSDTBalance(address);

      expect(balance).toBe('999999999.999999');
    });

    it('should handle very small balance amounts', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      mockPolygonClient.getUSDTBalance.mockResolvedValue('0.000001');

      const balance = await mockPolygonClient.getUSDTBalance(address);

      expect(balance).toBe('0.000001');
    });

    it('should handle network timeout errors', async () => {
      mockPolygonClient.getBlockNumber.mockRejectedValue(
        new Error('Network timeout')
      );

      await expect(mockPolygonClient.getBlockNumber()).rejects.toThrow(
        'Network timeout'
      );
    });
  });
});

