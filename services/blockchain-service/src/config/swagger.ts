/**
 * Swagger/OpenAPI Configuration for Blockchain Service
 * 
 * Production-ready API documentation using OpenAPI 3.0 specification
 * 
 * @module blockchain-service/config/swagger
 */

import swaggerJsdoc from 'swagger-jsdoc';
import { SwaggerDefinition } from 'swagger-jsdoc';

const swaggerDefinition: SwaggerDefinition = {
  openapi: '3.0.0',
  info: {
    title: 'Shield Blockchain Service API',
    version: '1.0.0',
    description: `
# Shield Blockchain Service API v1

Production-ready blockchain integration service for Polygon and Tron networks.

## Features
- USDT balance checking on Polygon and Tron
- Transaction monitoring and validation
- Wallet verification
- Gas/energy estimation
- Direct blockchain RPC calls

## Authentication
All endpoints require JWT authentication via Bearer token in the Authorization header.

## Supported Chains
- **POLYGON** - Polygon (MATIC) network
- **TRON** - Tron network

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
      url: 'http://localhost:3004/v1',
      description: 'Development server (v1 API)',
    },
    {
      url: 'https://api.shield.com/v1',
      description: 'Production server (v1 API)',
    },
  ],
  tags: [
    {
      name: 'Blockchain',
      description: 'Blockchain interaction endpoints',
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
      },
    },
    schemas: {
      ChainType: {
        type: 'string',
        enum: ['POLYGON', 'TRON'],
        example: 'POLYGON',
      },
      BalanceResponse: {
        type: 'object',
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'object',
            properties: {
              chain: { $ref: '#/components/schemas/ChainType' },
              address: { type: 'string' },
              balance: { type: 'string', example: '1000.50' },
              symbol: { type: 'string', example: 'USDT' },
            },
          },
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

