/**
 * Unit Tests for Compliance Service
 */

import {
  performKYC,
  performKYB,
  screenWallet,
  screenTransaction,
  getComplianceStatus,
  reviewComplianceCheck,
} from '../src/complianceService';
import prisma from '../src/database';
import {
  ServiceError,
  NotFoundError,
  ComplianceStatus,
  RiskLevel,
  EntityType,
} from '../../../shared/types';

// Mock Prisma
jest.mock('../src/database', () => ({
  __esModule: true,
  default: {
    complianceCheck: {
      create: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
    },
  },
}));

// Mock axios
jest.mock('axios', () => ({
  post: jest.fn(),
}));

const mockPrisma = prisma as jest.Mocked<typeof prisma>;

describe('Compliance Service', () => {
  const mockUserId = 'user-123';
  const mockCheckId = 'check-123';

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('performKYC', () => {
    it('should perform KYC check successfully', async () => {
      const kycData = {
        firstName: 'John',
        lastName: 'Doe',
        dateOfBirth: '1990-01-01',
        country: 'US',
        documentType: 'PASSPORT',
        documentNumber: 'ABC123456',
      };

      const mockCheck = {
        id: mockCheckId,
        entityType: EntityType.USER,
        entityId: mockUserId,
        status: ComplianceStatus.PENDING,
        riskLevel: RiskLevel.LOW,
        checkType: 'KYC',
        details: kycData,
        reviewNotes: null,
        reviewedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.complianceCheck.create.mockResolvedValue(mockCheck as any);

      const result = await performKYC(mockUserId, kycData);

      expect(result).toEqual(mockCheck);
      expect(mockPrisma.complianceCheck.create).toHaveBeenCalled();
    });

    it('should throw error if required fields are missing', async () => {
      const kycData = {
        firstName: 'John',
        // Missing lastName and documentNumber
      } as any;

      await expect(performKYC(mockUserId, kycData)).rejects.toThrow(ServiceError);
    });
  });

  describe('performKYB', () => {
    it('should perform KYB check successfully', async () => {
      const kybData = {
        businessName: 'Test Business Inc.',
        registrationNumber: 'REG123456',
        country: 'US',
        documents: ['doc1.pdf', 'doc2.pdf'],
      };

      const mockCheck = {
        id: mockCheckId,
        entityType: EntityType.BUSINESS,
        entityId: mockUserId,
        status: ComplianceStatus.PENDING,
        riskLevel: RiskLevel.LOW,
        checkType: 'KYB',
        details: kybData,
        reviewNotes: null,
        reviewedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.complianceCheck.create.mockResolvedValue(mockCheck as any);

      const result = await performKYB(mockUserId, kybData);

      expect(result).toEqual(mockCheck);
      expect(mockPrisma.complianceCheck.create).toHaveBeenCalled();
    });

    it('should throw error if required fields are missing', async () => {
      const kybData = {
        businessName: 'Test Business',
        // Missing registrationNumber
      } as any;

      await expect(performKYB(mockUserId, kybData)).rejects.toThrow(ServiceError);
    });
  });

  describe('screenWallet', () => {
    it('should screen wallet successfully', async () => {
      const address = '0x1234567890123456789012345678901234567890';
      const chain = 'POLYGON';

      const mockCheck = {
        id: mockCheckId,
        entityType: EntityType.WALLET,
        entityId: address,
        status: ComplianceStatus.APPROVED,
        riskLevel: RiskLevel.LOW,
        checkType: 'AML_SANCTIONS',
        details: {
          address,
          chain,
          isSanctioned: false,
        },
        reviewNotes: null,
        reviewedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.complianceCheck.create.mockResolvedValue(mockCheck as any);

      const result = await screenWallet(address, chain);

      expect(result).toEqual(mockCheck);
      expect(mockPrisma.complianceCheck.create).toHaveBeenCalled();
    });

    it('should mark wallet as rejected if sanctioned', async () => {
      const address = '0xSANCTIONED';
      const chain = 'POLYGON';

      // Mock axios to return sanctioned address
      const axios = require('axios');
      axios.post.mockResolvedValue({
        data: {
          riskLevel: RiskLevel.CRITICAL,
          isSanctioned: true,
          details: { source: 'test' },
        },
      });

      const mockCheck = {
        id: mockCheckId,
        entityType: EntityType.WALLET,
        entityId: address,
        status: ComplianceStatus.REJECTED,
        riskLevel: RiskLevel.CRITICAL,
        checkType: 'AML_SANCTIONS',
        details: {
          address,
          chain,
          isSanctioned: true,
        },
        reviewNotes: null,
        reviewedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.complianceCheck.create.mockResolvedValue(mockCheck as any);

      const result = await screenWallet(address, chain);

      expect(result.status).toBe(ComplianceStatus.REJECTED);
    });
  });

  describe('screenTransaction', () => {
    it('should screen transaction successfully', async () => {
      const transactionId = 'tx-123';
      const fromAddress = '0x1234567890123456789012345678901234567890';
      const amount = '1000.00';

      const mockCheck = {
        id: mockCheckId,
        entityType: EntityType.TRANSACTION,
        entityId: transactionId,
        status: ComplianceStatus.APPROVED,
        riskLevel: RiskLevel.LOW,
        checkType: 'AML_TRANSACTION',
        details: {
          transactionId,
          fromAddress,
          amount,
          isSanctioned: false,
        },
        reviewNotes: null,
        reviewedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.complianceCheck.create.mockResolvedValue(mockCheck as any);

      const result = await screenTransaction(transactionId, fromAddress, amount);

      expect(result).toEqual(mockCheck);
      expect(mockPrisma.complianceCheck.create).toHaveBeenCalled();
    });

    it('should mark large transactions as high risk', async () => {
      const transactionId = 'tx-123';
      const fromAddress = '0x1234567890123456789012345678901234567890';
      const amount = '150000.00'; // Large amount

      const axios = require('axios');
      axios.post.mockResolvedValue({
        data: {
          riskLevel: RiskLevel.LOW,
          isSanctioned: false,
          details: { source: 'test' },
        },
      });

      const mockCheck = {
        id: mockCheckId,
        entityType: EntityType.TRANSACTION,
        entityId: transactionId,
        status: ComplianceStatus.REVIEW_REQUIRED,
        riskLevel: RiskLevel.HIGH,
        checkType: 'AML_TRANSACTION',
        details: {
          transactionId,
          fromAddress,
          amount,
          isSanctioned: false,
        },
        reviewNotes: null,
        reviewedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.complianceCheck.create.mockResolvedValue(mockCheck as any);

      const result = await screenTransaction(transactionId, fromAddress, amount);

      expect(result.riskLevel).toBe(RiskLevel.HIGH);
    });
  });

  describe('getComplianceStatus', () => {
    it('should retrieve compliance status successfully', async () => {
      const mockCheck = {
        id: mockCheckId,
        entityType: EntityType.USER,
        entityId: mockUserId,
        status: ComplianceStatus.APPROVED,
        riskLevel: RiskLevel.LOW,
        checkType: 'KYC',
        details: {},
        reviewNotes: null,
        reviewedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.complianceCheck.findUnique.mockResolvedValue(mockCheck as any);

      const result = await getComplianceStatus(mockCheckId);

      expect(result).toEqual(mockCheck);
    });

    it('should throw NotFoundError if check does not exist', async () => {
      mockPrisma.complianceCheck.findUnique.mockResolvedValue(null);

      await expect(getComplianceStatus(mockCheckId)).rejects.toThrow(NotFoundError);
    });
  });

  describe('reviewComplianceCheck', () => {
    it('should review compliance check successfully', async () => {
      const reviewerId = 'reviewer-123';
      const mockCheck = {
        id: mockCheckId,
        entityType: EntityType.USER,
        entityId: mockUserId,
        status: ComplianceStatus.REVIEW_REQUIRED,
        riskLevel: RiskLevel.MEDIUM,
        checkType: 'KYC',
        details: {},
        reviewNotes: null,
        reviewedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const updatedCheck = {
        ...mockCheck,
        status: ComplianceStatus.APPROVED,
        reviewedBy: reviewerId,
        reviewNotes: 'Approved after review',
      };

      mockPrisma.complianceCheck.findUnique.mockResolvedValue(mockCheck as any);
      mockPrisma.complianceCheck.update.mockResolvedValue(updatedCheck as any);

      const result = await reviewComplianceCheck(
        mockCheckId,
        reviewerId,
        'APPROVED',
        'Approved after review'
      );

      expect(result.status).toBe(ComplianceStatus.APPROVED);
      expect(result.reviewedBy).toBe(reviewerId);
      expect(mockPrisma.complianceCheck.update).toHaveBeenCalled();
    });

    it('should throw error if check is not pending review', async () => {
      const reviewerId = 'reviewer-123';
      const mockCheck = {
        id: mockCheckId,
        entityType: EntityType.USER,
        entityId: mockUserId,
        status: ComplianceStatus.APPROVED, // Already approved
        riskLevel: RiskLevel.LOW,
        checkType: 'KYC',
        details: {},
        reviewNotes: null,
        reviewedBy: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockPrisma.complianceCheck.findUnique.mockResolvedValue(mockCheck as any);

      await expect(
        reviewComplianceCheck(mockCheckId, reviewerId, 'APPROVED')
      ).rejects.toThrow(ServiceError);
    });

    it('should throw NotFoundError if check does not exist', async () => {
      mockPrisma.complianceCheck.findUnique.mockResolvedValue(null);

      await expect(
        reviewComplianceCheck(mockCheckId, 'reviewer-123', 'APPROVED')
      ).rejects.toThrow(NotFoundError);
    });
  });
});

