/**
 * RefreshToken Domain Entity
 * 
 * Represents a refresh token in the domain layer
 * 
 * @module auth-service/domain/entities
 */

import { isNotNull, isNonEmptyString, isValidUUID, isValidDate, isExpiredDate } from '@shield/shared/utils/guards';

/**
 * RefreshToken domain entity
 */
export class RefreshToken {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly token: string,
    public readonly expiresAt: Date,
    public readonly createdAt: Date
  ) {
    this.validate();
  }

  /**
   * Creates a new RefreshToken entity
   */
  public static create(
    id: string,
    userId: string,
    token: string,
    expiresAt: Date,
    createdAt: Date = new Date()
  ): RefreshToken {
    return new RefreshToken(id, userId, token, expiresAt, createdAt);
  }

  /**
   * Reconstructs RefreshToken from persistence layer
   */
  public static fromPersistence(data: {
    id: string;
    userId: string;
    token: string;
    expiresAt: Date;
    createdAt: Date;
  }): RefreshToken {
    return new RefreshToken(
      data.id,
      data.userId,
      data.token,
      data.expiresAt,
      data.createdAt
    );
  }

  /**
   * Validates refresh token entity invariants
   */
  private validate(): void {
    if (!isValidUUID(this.id)) {
      throw new Error('RefreshToken ID must be a valid UUID');
    }

    if (!isValidUUID(this.userId)) {
      throw new Error('RefreshToken userId must be a valid UUID');
    }

    if (!isNonEmptyString(this.token)) {
      throw new Error('RefreshToken token cannot be empty');
    }

    if (!isValidDate(this.expiresAt)) {
      throw new Error('RefreshToken expiresAt must be a valid date');
    }

    if (!isNotNull(this.createdAt)) {
      throw new Error('RefreshToken createdAt cannot be null');
    }
  }

  /**
   * Checks if token is expired
   */
  public isExpired(): boolean {
    return isExpiredDate(this.expiresAt);
  }

  /**
   * Checks if token is valid (not expired)
   */
  public isValid(): boolean {
    return !this.isExpired();
  }

  /**
   * Checks if refresh token is equal to another token
   */
  public equals(other: RefreshToken): boolean {
    return this.id === other.id && this.token === other.token;
  }

  /**
   * Converts to plain object for serialization
   */
  public toPlainObject(): {
    id: string;
    userId: string;
    expiresAt: Date;
    createdAt: Date;
  } {
    return {
      id: this.id,
      userId: this.userId,
      expiresAt: this.expiresAt,
      createdAt: this.createdAt,
    };
  }
}

