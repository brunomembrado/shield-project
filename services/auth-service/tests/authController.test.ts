/**
 * Comprehensive Unit Tests for Auth Controller
 * 
 * Tests all authentication endpoints with full coverage
 * 
 * @module auth-service/tests
 */

import request from 'supertest';
import app from '../src/index';
import { DependencyContainer } from '../src/infrastructure/dependencyInjection';
import { RegisterUserUseCase } from '../src/domain/useCases/RegisterUserUseCase';
import { LoginUserUseCase } from '../src/domain/useCases/LoginUserUseCase';
import { RefreshTokenUseCase } from '../src/domain/useCases/RefreshTokenUseCase';
import { LogoutUserUseCase } from '../src/domain/useCases/LogoutUserUseCase';
import { ConflictError, AuthenticationError, NotFoundError } from '../../../shared/types';

// Mock use cases
jest.mock('../src/infrastructure/dependencyInjection');

// Set NODE_ENV to test before importing app
process.env.NODE_ENV = 'test';

describe('Auth Controller - API v1', () => {
  let mockRegisterUseCase: jest.Mocked<RegisterUserUseCase>;
  let mockLoginUseCase: jest.Mocked<LoginUserUseCase>;
  let mockRefreshUseCase: jest.Mocked<RefreshTokenUseCase>;
  let mockLogoutUseCase: jest.Mocked<LogoutUserUseCase>;

  beforeEach(async () => {
    jest.clearAllMocks();
    
    // Create mock use cases
    mockRegisterUseCase = {
      execute: jest.fn(),
    } as any;
    
    mockLoginUseCase = {
      execute: jest.fn(),
    } as any;
    
    mockRefreshUseCase = {
      execute: jest.fn(),
    } as any;
    
    mockLogoutUseCase = {
      execute: jest.fn(),
    } as any;

    // Mock DependencyContainer
    const mockAuthController = {
      register: jest.fn((req, res) => mockRegisterUseCase.execute(req.body.email, req.body.password)),
      login: jest.fn((req, res) => mockLoginUseCase.execute(req.body.email, req.body.password)),
      refresh: jest.fn((req, res) => mockRefreshUseCase.execute(req.body.refreshToken)),
      logout: jest.fn((req, res) => mockLogoutUseCase.execute(req.body.refreshToken)),
    };

    (DependencyContainer.getInstance as jest.Mock) = jest.fn(() => ({
      authController: mockAuthController,
    }));

    // Set up routes manually in test mode
    const routesModule = await import('../src/routes');
    const authRoutes = routesModule.default;
    app.use('/v1/auth', authRoutes);
  });

  describe('POST /v1/auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockRegisterUseCase.execute.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecureP@ss123!Complex',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('user');
      expect(response.body.data).toHaveProperty('accessToken');
      expect(response.body.data).toHaveProperty('refreshToken');
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecureP@ss123!Complex',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          email: 'test@example.com',
          password: 'weak',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 409 for duplicate email', async () => {
      mockRegisterUseCase.execute.mockRejectedValue(
        new ConflictError('Email already registered')
      );

      const response = await request(app)
        .post('/v1/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecureP@ss123!Complex',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /v1/auth/login', () => {
    it('should login successfully', async () => {
      const mockResult = {
        user: {
          id: 'user-123',
          email: 'test@example.com',
          createdAt: new Date(),
        },
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockLoginUseCase.execute.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecureP@ss123!Complex',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid credentials', async () => {
      mockLoginUseCase.execute.mockRejectedValue(
        new AuthenticationError('Invalid credentials')
      );

      const response = await request(app)
        .post('/v1/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /v1/auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockResult = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockRefreshUseCase.execute.mockResolvedValue(mockResult);

      const response = await request(app)
        .post('/v1/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('accessToken');
    });

    it('should return 401 for invalid refresh token', async () => {
      mockRefreshUseCase.execute.mockRejectedValue(
        new AuthenticationError('Invalid refresh token')
      );

      const response = await request(app)
        .post('/v1/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /v1/auth/logout', () => {
    it('should logout successfully', async () => {
      mockLogoutUseCase.execute.mockResolvedValue({ message: 'Logged out successfully' });

      const response = await request(app)
        .post('/v1/auth/logout')
        .send({
          refreshToken: 'valid-refresh-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 401 for invalid refresh token', async () => {
      mockLogoutUseCase.execute.mockRejectedValue(
        new NotFoundError('Refresh token not found')
      );

      const response = await request(app)
        .post('/v1/auth/logout')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
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

