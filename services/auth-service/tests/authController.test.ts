/**
 * Unit Tests for Auth Controller
 */

import request from 'supertest';
import app from '../src/index';
import * as authService from '../src/authService';
import { ServiceError } from '../../../shared/types';

// Mock authService
jest.mock('../src/authService');

const mockAuthService = authService as jest.Mocked<typeof authService>;

describe('Auth Controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('POST /auth/register', () => {
    it('should register a new user successfully', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockAuthService.registerUser.mockResolvedValue(mockTokens);

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTokens);
    });

    it('should return 400 for invalid email', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'invalid-email',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for weak password', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
          password: '123',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing fields', async () => {
      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle duplicate email error', async () => {
      mockAuthService.registerUser.mockRejectedValue(
        new ServiceError('Email already registered', 409)
      );

      const response = await request(app)
        .post('/auth/register')
        .send({
          email: 'existing@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(409);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Email already registered');
    });
  });

  describe('POST /auth/login', () => {
    it('should login successfully', async () => {
      const mockTokens = {
        accessToken: 'mock-access-token',
        refreshToken: 'mock-refresh-token',
      };

      mockAuthService.loginUser.mockResolvedValue(mockTokens);

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockTokens);
    });

    it('should return 401 for invalid credentials', async () => {
      mockAuthService.loginUser.mockRejectedValue(
        new ServiceError('Invalid credentials', 401)
      );

      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
          password: 'WrongPassword',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing email', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          password: 'SecurePass123!',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing password', async () => {
      const response = await request(app)
        .post('/auth/login')
        .send({
          email: 'test@example.com',
        });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/refresh', () => {
    it('should refresh token successfully', async () => {
      const mockNewTokens = {
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      };

      mockAuthService.refreshAccessToken.mockResolvedValue(mockNewTokens);

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'valid-refresh-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toEqual(mockNewTokens);
    });

    it('should return 401 for invalid refresh token', async () => {
      mockAuthService.refreshAccessToken.mockRejectedValue(
        new ServiceError('Invalid refresh token', 401)
      );

      const response = await request(app)
        .post('/auth/refresh')
        .send({
          refreshToken: 'invalid-token',
        });

      expect(response.status).toBe(401);
      expect(response.body.success).toBe(false);
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/auth/refresh')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });
  });

  describe('POST /auth/logout', () => {
    it('should logout successfully', async () => {
      mockAuthService.logoutUser.mockResolvedValue(undefined);

      const response = await request(app)
        .post('/auth/logout')
        .send({
          refreshToken: 'valid-refresh-token',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    it('should return 400 for missing refresh token', async () => {
      const response = await request(app)
        .post('/auth/logout')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should handle logout error gracefully', async () => {
      mockAuthService.logoutUser.mockRejectedValue(
        new Error('Database error')
      );

      const response = await request(app)
        .post('/auth/logout')
        .send({
          refreshToken: 'valid-token',
        });

      expect(response.status).toBe(500);
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

  describe('404 Not Found', () => {
    it('should return 404 for unknown routes', async () => {
      const response = await request(app).get('/unknown-route');

      expect(response.status).toBe(404);
      expect(response.body.success).toBe(false);
    });
  });
});

