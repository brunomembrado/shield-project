/**
 * Logout User Use Case
 * 
 * Business logic for user logout
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

/**
 * Logout user use case result
 */
export interface LogoutUserResult {
  message: string;
}

/**
 * Logout User Use Case
 */
export class LogoutUserUseCase {
  constructor(
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Executes the logout user use case
   */
  public async execute(refreshTokenString: string): Promise<LogoutUserResult> {
    try {
      // Verify refresh token signature
      this.tokenService.verifyRefreshToken(refreshTokenString);

      // Delete refresh token from database
      await this.refreshTokenRepository.deleteByToken(refreshTokenString);

      return {
        message: 'Logged out successfully',
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
      throw handleUnknownError(error, 'Failed to logout', {
        operation: 'logoutUser',
      });
    }
  }
}

