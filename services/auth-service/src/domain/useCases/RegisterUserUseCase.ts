/**
 * Register User Use Case
 * 
 * Business logic for user registration
 * 
 * @module auth-service/domain/useCases
 */

import { User } from '../entities/User';
import { RefreshToken } from '../entities/RefreshToken';
import { Email } from '../valueObjects/Email';
import { IUserRepository } from '../repositories/IUserRepository';
import { IRefreshTokenRepository } from '../repositories/IRefreshTokenRepository';
import { IPasswordService } from '../services/IPasswordService';
import { ITokenService } from '../services/ITokenService';
import {
  ConflictError,
  ServiceError,
  handleUnknownError,
  ValidationError,
} from '@shield/shared/errors';
import { isNotNull } from '@shield/shared/utils/guards';
import { v4 as uuidv4 } from 'uuid';
import { addDays } from '@shield/shared/utils';

/**
 * Register user use case result
 */
export interface RegisterUserResult {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    createdAt: Date;
  };
}

/**
 * Register User Use Case
 */
export class RegisterUserUseCase {
  constructor(
    private readonly userRepository: IUserRepository,
    private readonly refreshTokenRepository: IRefreshTokenRepository,
    private readonly passwordService: IPasswordService,
    private readonly tokenService: ITokenService
  ) {}

  /**
   * Executes the register user use case
   */
  public async execute(
    email: string,
    password: string,
    correlationId: string = ''
  ): Promise<RegisterUserResult> {
    try {
      // Create email value object
      const emailValueObject = Email.create(email);

      // Check if user already exists
      const existingUser = await this.userRepository.findByEmail(emailValueObject);
      if (isNotNull(existingUser)) {
        throw new ConflictError('User with this email already exists');
      }

      // Hash password
      const hashedPassword = await this.passwordService.hash(password);

      // Create user entity
      const now = new Date();
      const user = User.create(
        uuidv4(),
        emailValueObject.getValue(),
        hashedPassword,
        now,
        now
      );

      // Save user
      const savedUser = await this.userRepository.save(user);

      // Generate tokens
      const accessToken = this.tokenService.generateAccessToken(
        savedUser.id,
        savedUser.email
      );
      const refreshToken = this.tokenService.generateRefreshToken(
        savedUser.id,
        savedUser.email
      );

      // Create and save refresh token
      const expiresAt = addDays(new Date(), 7);
      const refreshTokenEntity = await this.refreshTokenRepository.save(
        RefreshToken.create(
          uuidv4(),
          savedUser.id,
          refreshToken,
          expiresAt
        )
      );

      return {
        accessToken,
        refreshToken,
        user: {
          id: savedUser.id,
          email: savedUser.email,
          createdAt: savedUser.createdAt,
        },
      };
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof ConflictError ||
        error instanceof ServiceError ||
        error instanceof ValidationError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to register user', {
        email,
        operation: 'registerUser',
        correlationId,
      });
    }
  }
}

