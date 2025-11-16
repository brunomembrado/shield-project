/**
 * Password Service Interface
 * 
 * Defines the contract for password hashing and verification
 * This abstraction allows for different password hashing strategies
 * 
 * @module auth-service/domain/services
 */

/**
 * Password service interface
 */
export interface IPasswordService {
  /**
   * Hashes a plain text password
   */
  hash(password: string): Promise<string>;

  /**
   * Compares a plain text password with a hash
   */
  compare(password: string, hash: string): Promise<boolean>;
}

