/**
 * Auth Service Unit Tests
 * 
 * Tests for authentication business logic:
 * - User registration
 * - User login
 * - Token refresh
 * - User logout
 * 
 * @module auth-service/tests
 */

import * as authService from '../src/authService';
import prisma from '../src/database';
import { ConflictError, AuthenticationError, NotFoundError } from '../../../shared/types';

// Mock Prisma client
jest.mock('../src/database', () => ({
  __esModule: true,
  default: {
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    refreshToken: {
      create: jest.fn(),
      findUnique: jest.fn(),
      delete: jest.fn(),
      deleteMany: jest.fn(),
    },
    $transaction: jest.fn(),
  },
}));

// Mock bcryptjs
jest.mock('bcryptjs', () => ({
  hash: jest.fn().mockResolvedValue('hashedPassword123'),
  compare: jest.fn(),
}));

// Mock jsonwebtoken
jest.mock('jsonwebtoken', () => ({
  sign: jest.fn((payload: Record<string, unknown>) => `mock_token_${payload.userId as string}`),
  verify: jest.fn(),
}));

describe('Auth Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    
    // Set environment variables for tests
    process.env.JWT_SECRET = 'test_jwt_secret';
    process.env.JWT_REFRESH_SECRET = 'test_refresh_secret';
    process.env.JWT_EXPIRES_IN = '15m';
    process.env.JWT_REFRESH_EXPIRES_IN = '7d';
  });

  describe('register', () => {
    it('should successfully register a new user', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRefreshToken = {
        id: 'token-123',
        userId: mockUser.id,
        token: 'mock_token_user-123',
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      // Mock Prisma calls
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);
      (prisma.user.create as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue(mockRefreshToken);

      // Execute
      const result = await authService.register('test@example.com', 'Password123!');

      // Assertions
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(prisma.user.create).toHaveBeenCalledTimes(1);
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('should throw ConflictError if user already exists', async () => {
      const existingUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(existingUser);

      // Execute and expect error
      await expect(
        authService.register('test@example.com', 'Password123!')
      ).rejects.toThrow(ConflictError);

      expect(prisma.user.create).not.toHaveBeenCalled();
    });
  });

  describe('login', () => {
    it('should successfully login with valid credentials', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockRefreshToken = {
        id: 'token-123',
        userId: mockUser.id,
        token: 'mock_token_user-123',
        expiresAt: new Date(),
        createdAt: new Date(),
      };

      // Mock Prisma and bcrypt calls
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.refreshToken.create as jest.Mock).mockResolvedValue(mockRefreshToken);
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(true);

      // Execute
      const result = await authService.login('test@example.com', 'Password123!');

      // Assertions
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(result).toHaveProperty('user');
      expect(result.user.email).toBe('test@example.com');
      expect(prisma.refreshToken.create).toHaveBeenCalledTimes(1);
    });

    it('should throw AuthenticationError for invalid email', async () => {
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.login('wrong@example.com', 'Password123!')
      ).rejects.toThrow(AuthenticationError);
    });

    it('should throw AuthenticationError for invalid password', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      
      const bcrypt = require('bcryptjs');
      bcrypt.compare.mockResolvedValue(false);

      await expect(
        authService.login('test@example.com', 'WrongPassword!')
      ).rejects.toThrow(AuthenticationError);
    });
  });

  describe('refreshAccessToken', () => {
    it('should successfully refresh access token', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockStoredToken = {
        id: 'token-123',
        userId: mockUser.id,
        token: 'old_refresh_token',
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
        createdAt: new Date(),
        user: mockUser,
      };

      // Mock JWT verification
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      });

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockStoredToken);
      (prisma.$transaction as jest.Mock).mockResolvedValue([{}, {}]);

      // Execute
      const result = await authService.refreshAccessToken('old_refresh_token');

      // Assertions
      expect(result).toHaveProperty('accessToken');
      expect(result).toHaveProperty('refreshToken');
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError if refresh token not in database', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
      });

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        authService.refreshAccessToken('invalid_token')
      ).rejects.toThrow(NotFoundError);
    });

    it('should throw AuthenticationError if token is expired', async () => {
      const mockUser = {
        id: 'user-123',
        email: 'test@example.com',
        password: 'hashedPassword123',
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockStoredToken = {
        id: 'token-123',
        userId: mockUser.id,
        token: 'expired_token',
        expiresAt: new Date(Date.now() - 1000), // Expired
        createdAt: new Date(),
        user: mockUser,
      };

      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        userId: mockUser.id,
        email: mockUser.email,
      });

      (prisma.refreshToken.findUnique as jest.Mock).mockResolvedValue(mockStoredToken);
      (prisma.refreshToken.delete as jest.Mock).mockResolvedValue(mockStoredToken);

      await expect(
        authService.refreshAccessToken('expired_token')
      ).rejects.toThrow(AuthenticationError);

      expect(prisma.refreshToken.delete).toHaveBeenCalledTimes(1);
    });
  });

  describe('logout', () => {
    it('should successfully logout and revoke refresh token', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
      });

      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 1 });

      // Execute
      const result = await authService.logout('valid_refresh_token');

      // Assertions
      expect(result).toHaveProperty('message');
      expect(result.message).toBe('Logged out successfully');
      expect(prisma.refreshToken.deleteMany).toHaveBeenCalledTimes(1);
    });

    it('should throw NotFoundError if refresh token not found', async () => {
      const jwt = require('jsonwebtoken');
      jwt.verify.mockReturnValue({
        userId: 'user-123',
        email: 'test@example.com',
      });

      (prisma.refreshToken.deleteMany as jest.Mock).mockResolvedValue({ count: 0 });

      await expect(
        authService.logout('nonexistent_token')
      ).rejects.toThrow(NotFoundError);
    });
  });
});

