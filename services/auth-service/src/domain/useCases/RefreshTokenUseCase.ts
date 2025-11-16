/**
 * Refresh Token Use Case
 * 
 * Business logic for refreshing access tokens
 * 
 * @module auth-service/domain/useCases
 */

import { IRefreshTokenRepository } from '../repositories/IRefreshTokenRepository';
import { ITokenService } from '../services/ITokenService';
import {
  AuthenticationError,
  NotFoundError,
  ServiceError,
  handleUnknownError,
} from '@shield/shared/errors';
import { isNotNull } from '@shield/shared/utils/guards';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from '@shield/shared/utils';
import { RefreshToken } from '../entities/RefreshToken';

/**
 * Refresh token use case result
 */
export interface RefreshTokenResult {
  accessToken: string;
  refreshToken: string;
}

/**
 * Refresh Token Use Case
 */
export class RefreshTokenUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Executes the refresh token use case
   */
  public async execute(refreshTokenString: string): Promise<RefreshTokenResult> {
    try {
      // Verify refresh token signature
      const decoded = this.tokenService.verifyRefreshToken(refreshTokenString);

      // Find refresh token in database
      const storedToken = await this.refreshTokenRepository.findByToken(
        refreshTokenString
      );

      if (!isNotNull(storedToken)) {
        throw new NotFoundError('Refresh token');
      }

      // Check if token is expired
      if (storedToken.isExpired()) {
        // Delete expired token
        await this.refreshTokenRepository.deleteById(storedToken.id);
        throw new AuthenticationError('Refresh token has expired');
      }

      // Generate new access token
      const accessToken = this.tokenService.generateAccessToken(
        decoded.userId,
        decoded.email
      );

      // Rotate refresh token (security best practice)
      const newRefreshToken = this.tokenService.generateRefreshToken(
        decoded.userId,
        decoded.email
      );
      const expiresAt = addDays(new Date(), 7);

      // Replace old refresh token with new one
      await this.refreshTokenRepository.deleteById(storedToken.id);
      await this.refreshTokenRepository.save(
        RefreshToken.create(
          uuidv4(),
          decoded.userId,
          newRefreshToken,
          expiresAt
        )
      );

      return {
        accessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof AuthenticationError ||
        error instanceof NotFoundError ||
        error instanceof ServiceError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to refresh token', {
        operation: 'refreshToken',
      });
    }
  }
}

