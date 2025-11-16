/**
 * Token Service Implementation
 * 
 * JWT-based token generation and verification
 * 
 * @module auth-service/data/services
 */

import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { ITokenService } from '../../domain/services/ITokenService';
import { JWTPayload, AuthenticationError, ServiceError } from '@shield/shared/types';
import { isNotNull } from '@shield/shared/utils/guards';

/**
 * Token Service Implementation using JWT
 */
export class TokenService implements ITokenService {
  private readonly accessTokenSecret: string;
  private readonly refreshTokenSecret: string;
  private readonly accessTokenExpiresIn: string;
  private readonly refreshTokenExpiresIn: string;

  constructor() {
    this.accessTokenSecret = this.getRequiredEnv('JWT_SECRET');
    this.refreshTokenSecret = this.getRequiredEnv('JWT_REFRESH_SECRET');
    this.accessTokenExpiresIn = process.env.JWT_EXPIRES_IN || '15m';
    this.refreshTokenExpiresIn = process.env.JWT_REFRESH_EXPIRES_IN || '7d';
    
    // DEBUG: Log JWT secret length for verification
    console.log(`[DEBUG AUTH-SERVICE] JWT_SECRET length: ${this.accessTokenSecret.length}, First 20 chars: ${this.accessTokenSecret.substring(0, 20)}...`);
  }

  /**
   * Gets required environment variable or throws
   */
  private getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!isNotNull(value)) {
      throw new ServiceError(`${key} is not configured`, 500);
    }
    return value;
  }

  /**
   * Generates an access token
   */
  public generateAccessToken(userId: string, email: string): string {
    const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
      userId,
      email,
    };

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiresIn,
    });
  }

  /**
   * Generates a refresh token
   */
  public generateRefreshToken(userId: string, email: string): string {
    const payload = {
      userId,
      email,
      tokenId: uuidv4(),
    };

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiresIn,
    });
  }

  /**
   * Verifies and decodes a refresh token
   */
  public verifyRefreshToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.refreshTokenSecret);
      
      if (typeof decoded === 'string' || !isNotNull(decoded)) {
        throw new AuthenticationError('Invalid token format');
      }

      return decoded as JWTPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired refresh token');
    }
  }

  /**
   * Verifies and decodes an access token
   */
  public verifyAccessToken(token: string): JWTPayload {
    try {
      const decoded = jwt.verify(token, this.accessTokenSecret);
      
      if (typeof decoded === 'string' || !isNotNull(decoded)) {
        throw new AuthenticationError('Invalid token format');
      }

      return decoded as JWTPayload;
    } catch (error) {
      throw new AuthenticationError('Invalid or expired access token');
    }
  }
}

