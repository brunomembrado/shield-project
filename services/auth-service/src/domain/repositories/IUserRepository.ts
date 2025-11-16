/**
 * User Repository Interface
 * 
 * Defines the contract for user persistence operations
 * This is in the domain layer and is database-agnostic
 * 
 * @module auth-service/domain/repositories
 */

import { User } from '../entities/User';
import { Email } from '../valueObjects/Email';

/**
 * User repository interface
 * 
 * Defines all operations for user persistence
 * Implementation is in the data layer
 */
export interface IUserRepository {
  /**
   * Finds a user by email
   */
  findByEmail(email: Email): Promise<User | null>;

  /**
   * Finds a user by ID
   */
  findById(id: string): Promise<User | null>;

  /**
   * Saves a new user
   */
  save(user: User): Promise<User>;

  /**
   * Checks if a user exists with the given email
   */
  existsByEmail(email: Email): Promise<boolean>;

  /**
   * Updates an existing user
   */
  update(user: User): Promise<User>;

  /**
   * Deletes a user by ID
   */
  delete(id: string): Promise<void>;
}

