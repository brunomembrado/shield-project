/**
 * Swagger/OpenAPI Configuration for Wallet Service
 * 
 * Production-ready API documentation using OpenAPI 3.0 specification
 * 
 * @module wallet-service/config/swagger
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Shield Wallet Service API',
    version: '1.0.0',
    description: `
# Shield Wallet Service API v1

Production-ready wallet management service for Polygon and Tron networks.

## Features
- Create and manage blockchain wallets
- Generate new wallets with encrypted private key storage
- Import existing wallet addresses
- Reveal private keys (system-generated wallets only)
- Wallet filtering and management

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header.

## API Versioning
- Current version: **v1**
- Future version: **v2** (will be implemented when breaking changes are needed)
- To upgrade: Simply change `/v1` to `/v2` in your API requests
    `,
    contact: {
      name: 'Shield Security, Inc.',
      email: 'support@shield.com',
    },
  },
  servers: [
    {
      url: 'http://localhost:3002/v1',
      description: 'Development server (v1 API)',
    },
    {
      url: 'https://api.shield.com/v1',
      description: 'Production server (v1 API)',
    },
  ],
  tags: [
    {
      name: 'Wallets',
      description: 'Wallet management endpoints',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
    schemas: {
      Wallet: {
        type: 'object',
        properties: {
          id: { type: 'string', format: 'uuid' },
          userId: { type: 'string', format: 'uuid' },
          chain: { type: 'string', enum: ['POLYGON', 'TRON'] },
          address: { type: 'string' },
          tag: { type: 'string', nullable: true },
          isActive: { type: 'boolean' },
          createdBySystem: { type: 'boolean' },
        },
      },
      ErrorResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean', example: false },
          error: { type: 'string' },
          message: { type: 'string' },
        },
      },
    },
  },
};

const options = {
  definition: swaggerDefinition,
  apis: ['./src/routes.ts'],
};

export const swaggerSpec = swaggerJsdoc(options);

