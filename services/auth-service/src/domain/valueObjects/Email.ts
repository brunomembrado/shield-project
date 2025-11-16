/**
 * Email Value Object
 * 
 * Represents an email address as a value object
 * Ensures email validation and immutability
 * 
 * @module auth-service/domain/valueObjects
 */

import { isValidEmailFormat, isNonEmptyString } from '@shield/shared/utils/guards';

/**
 * Email value object
 */
export class Email {
  private constructor(private readonly value: string) {
    this.validate();
  }

  /**
   * Creates a new Email value object
   */
  public static create(value: string): Email {
    return new Email(value);
  }

  /**
   * Validates email format
   */
  private validate(): void {
    if (!isNonEmptyString(this.value)) {
      throw new Error('Email cannot be empty');
    }

    if (!isValidEmailFormat(this.value)) {
      throw new Error(`Invalid email format: ${this.value}`);
    }
  }

  /**
   * Gets the email value
   */
  public getValue(): string {
    return this.value;
  }

  /**
   * Gets the email domain
   */
  public getDomain(): string {
    const parts = this.value.split('@');
    return parts.length > 1 ? parts[1] : '';
  }

  /**
   * Checks if email is equal to another email
   */
  public equals(other: Email): boolean {
    return this.value.toLowerCase() === other.value.toLowerCase();
  }

  /**
   * Converts to string
   */
  public toString(): string {
    return this.value;
  }
}

