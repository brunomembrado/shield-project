/**
 * Password Service Implementation
 * 
 * Bcrypt-based password hashing implementation
 * 
 * @module auth-service/data/services
 */

import bcrypt from 'bcryptjs';
import { IPasswordService } from '../../domain/services/IPasswordService';

/**
 * Password Service Implementation using bcrypt
 */
export class PasswordService implements IPasswordService {
  private readonly saltRounds: number = 12;

  /**
   * Hashes a plain text password
   */
  public async hash(password: string): Promise<string> {
    return bcrypt.hash(password, this.saltRounds);
  }

  /**
   * Compares a plain text password with a hash
   */
  public async compare(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }
}

