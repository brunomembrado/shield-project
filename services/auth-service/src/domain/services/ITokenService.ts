/**
 * Token Service Interface
 * 
 * Defines the contract for JWT token generation and verification
 * 
 * @module auth-service/domain/services
 */

import { JWTPayload } from '@shield/shared/types';

/**
 * Token service interface
 */
export interface ITokenService {
  /**
   * Generates an access token
   */
  generateAccessToken(userId: string, email: string): string;

  /**
   * Generates a refresh token
   */
  generateRefreshToken(userId: string, email: string): string;

  /**
   * Verifies and decodes a refresh token
   */
  verifyRefreshToken(token: string): JWTPayload;

  /**
   * Verifies and decodes an access token
   */
  verifyAccessToken(token: string): JWTPayload;
}

