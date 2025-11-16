/**
 * Swagger/OpenAPI Configuration for Auth Service
 * 
 * Production-ready API documentation using OpenAPI 3.0 specification
 * 
 * @module auth-service/config/swagger
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Shield Auth Service API',
    version: '1.0.0',
    description: [
      '# Shield Authentication Service API v1',
      '',
      'Production-ready authentication service for the Shield Platform.',
      '',
      '## Features',
      '- User registration with enterprise-grade password validation',
      '- Secure JWT-based authentication',
      '- Token refresh mechanism',
      '- Secure logout with token revocation',
      '',
      '## Authentication',
      'All endpoints (except registration) require JWT authentication via Bearer token in the Authorization header.',
      '',
      '## API Versioning',
      '- Current version: **v1**',
      '- Future version: **v2** (will be implemented when breaking changes are needed)',
      '- To upgrade: Simply change /v1 to /v2 in your API requests',
      '',
      '## Rate Limiting',
      '- Registration: 5 requests per hour per IP',
      '- Login: 10 requests per 15 minutes per IP',
      '- Token refresh: 20 requests per hour per user',
      '',
      '## Security',
      '- All passwords are hashed using bcrypt',
      '- JWT tokens are signed with RS256 algorithm',
      '- Refresh tokens are stored securely and can be revoked',
      '- Enterprise-grade password validation (min 12 chars, complexity requirements)',
    ].join('\n'),
    contact: {
      name: 'Shield Security, Inc.',
      email: 'support@shield.com',
    },
    license: {
      name: 'MIT',
      url: 'https://opensource.org/licenses/MIT',
    },
  },
  servers: [
    {
      url: 'http://localhost:3001/v1',
      description: 'Development server (v1 API)',
    },
    {
      url: 'https://api.shield.com/v1',
      description: 'Production server (v1 API)',
    },
  ],
  tags: [
    {
      name: 'Authentication',
      description: 'User authentication and authorization endpoints',
    },
    {
      name: 'Health',
      description: 'Service health check endpoints',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT token obtained from login endpoint',
      },
    },
    schemas: {
      RegisterRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
            description: 'User email address (must be valid email format)',
          },
          password: {
            type: 'string',
            minLength: 12,
            example: 'SecureP@ss123!Complex',
            description: 'Password must be at least 12 characters with uppercase, lowercase, number, and special character',
          },
        },
      },
      LoginRequest: {
        type: 'object',
        required: ['email', 'password'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          password: {
            type: 'string',
            example: 'SecureP@ss123!Complex',
          },
        },
      },
      RefreshTokenRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
            description: 'Refresh token obtained from login or register',
          },
        },
      },
      LogoutRequest: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: {
            type: 'string',
            example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
          },
        },
      },
      User: {
        type: 'object',
        properties: {
          id: {
            type: 'string',
            format: 'uuid',
            example: '550e8400-e29b-41d4-a716-446655440000',
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'user@example.com',
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z',
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2024-01-01T00:00:00Z',
          },
        },
      },
      AuthResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: true,
          },
          data: {
            type: 'object',
            properties: {
              user: {
                $ref: '#/components/schemas/User',
              },
              accessToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                description: 'JWT access token (expires in 15 minutes)',
              },
              refreshToken: {
                type: 'string',
                example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
                description: 'JWT refresh token (expires in 7 days)',
              },
            },
          },
          message: {
            type: 'string',
            example: 'Login successful',
          },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: {
            type: 'boolean',
            example: false,
          },
          error: {
            type: 'string',
            example: 'VALIDATION_ERROR',
          },
          message: {
            type: 'string',
            example: 'Email is required',
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
          },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes.ts', './src/presentation/controllers/*.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

