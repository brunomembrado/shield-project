/**
 * User Domain Entity
 * 
 * Represents a user in the domain layer (business logic)
 * This is a pure domain object with no database dependencies
 * 
 * @module auth-service/domain/entities
 */

import { isNotNull, isNonEmptyString, isValidEmailFormat, isValidUUID } from '@shield/shared/utils/guards';

/**
 * User domain entity
 */
export class User {
  private constructor(
    public readonly id: string,
    public readonly email: string,
    public readonly hashedPassword: string,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  /**
   * Creates a new User entity
   */
  public static create(
    id: string,
    email: string,
    hashedPassword: string,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ): User {
    return new User(id, email, hashedPassword, createdAt, updatedAt);
  }

  /**
   * Reconstructs User from persistence layer
   */
  public static fromPersistence(data: {
    id: string;
    email: string;
    password: string;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User(
      data.id,
      data.email,
      data.password,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Validates user entity invariants
   */
  private validate(): void {
    if (!isValidUUID(this.id)) {
      throw new Error('User ID must be a valid UUID');
    }

    if (!isValidEmailFormat(this.email)) {
      throw new Error('User email must be a valid email format');
    }

    if (!isNonEmptyString(this.hashedPassword)) {
      throw new Error('User password hash cannot be empty');
    }

    if (!isNotNull(this.createdAt) || !isNotNull(this.updatedAt)) {
      throw new Error('User timestamps cannot be null');
    }
  }

  /**
   * Checks if user is equal to another user
   */
  public equals(other: User): boolean {
    return this.id === other.id && this.email === other.email;
  }

  /**
   * Converts to plain object for serialization
   */
  public toPlainObject(): {
    id: string;
    email: string;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      email: this.email,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

