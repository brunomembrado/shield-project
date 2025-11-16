/**
 * Login User Use Case
 * 
 * Business logic for user authentication
 * 
 * @module auth-service/domain/useCases
 */

import { Email } from '../valueObjects/Email';
import { RefreshToken } from '../entities/RefreshToken';
import { IUserRepository } from '../repositories/IUserRepository';
import { IRefreshTokenRepository } from '../repositories/IRefreshTokenRepository';
import { IPasswordService } from '../services/IPasswordService';
import { ITokenService } from '../services/ITokenService';
import {
  AuthenticationError,
  ServiceError,
  handleUnknownError,
  ValidationError,
} from '@shield/shared/errors';
import { isNotNull } from '@shield/shared/utils/guards';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from '@shield/shared/utils';
import { 
  recordFailedLogin, 
  recordSuccessfulLogin,
  isAccountLocked,
  getLockRemainingTime 
} from '@shield/shared/security';

/**
 * Login user use case result
 */
export interface LoginUserResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    createdAt: Date;
  };
}

/**
 * Login User Use Case
 */
export class LoginUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Executes the login user use case
   */
  public async execute(
    email: string,
    password: string,
    correlationId: string = '',
    requestContext?: {
      ip?: string;
      userAgent?: string;
    }
  ): Promise<LoginUserResult> {
    try {
      // Check if account is locked (business logic)
      if (isAccountLocked(email)) {
        const remainingTime = getLockRemainingTime(email);
        throw new AuthenticationError(
          `Too many failed login attempts. Account is locked for ${remainingTime} seconds.`
        );
      }

      // Create email value object
      const emailValueObject = Email.create(email);

      // Find user by email
      const user = await this.userRepository.findByEmail(emailValueObject);
      if (!isNotNull(user)) {
        recordFailedLogin(email);
        throw new AuthenticationError('Invalid email or password');
      }

      // Verify password
      const isPasswordValid = await this.passwordService.compare(
        password,
        user.hashedPassword
      );

      if (!isPasswordValid) {
        recordFailedLogin(email);
        throw new AuthenticationError('Invalid email or password');
      }

      // Record successful login (business logic)
      recordSuccessfulLogin(email);

      // Generate tokens
      const accessToken = this.tokenService.generateAccessToken(
        user.id,
        user.email
      );
      const refreshToken = this.tokenService.generateRefreshToken(
        user.id,
        user.email
      );

      // Create and save refresh token
      const expiresAt = addDays(new Date(), 7);
      await this.refreshTokenRepository.save(
        RefreshToken.create(
          uuidv4(),
          user.id,
          refreshToken,
          expiresAt
        )
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
      };
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof AuthenticationError ||
        error instanceof ServiceError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to login', {
        email,
        operation: 'loginUser',
        correlationId,
      });
    }
  }
}
