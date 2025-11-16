/**
 * RefreshToken Repository Interface
 * 
 * Defines the contract for refresh token persistence operations
 * 
 * @module auth-service/domain/repositories
 */

import { RefreshToken } from '../entities/RefreshToken';

/**
 * RefreshToken repository interface
 */
export interface IRefreshTokenRepository {
  /**
   * Finds a refresh token by token string
   */
  findByToken(token: string): Promise<RefreshToken | null>;

  /**
   * Finds a refresh token by ID
   */
  findById(id: string): Promise<RefreshToken | null>;

  /**
   * Finds all refresh tokens for a user
   */
  findByUserId(userId: string): Promise<RefreshToken[]>;

  /**
   * Saves a new refresh token
   */
  save(token: RefreshToken): Promise<RefreshToken>;

  /**
   * Deletes a refresh token by token string
   */
  deleteByToken(token: string): Promise<void>;

  /**
   * Deletes a refresh token by ID
   */
  deleteById(id: string): Promise<void>;

  /**
   * Deletes all expired tokens
   */
  deleteExpired(): Promise<number>;

  /**
   * Deletes all tokens for a user
   */
  deleteByUserId(userId: string): Promise<void>;
}

