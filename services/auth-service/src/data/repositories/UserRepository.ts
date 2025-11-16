/**
 * User Repository Implementation
 * 
 * Prisma-based implementation of IUserRepository
 * Handles mapping between domain entities and database models
 * 
 * @module auth-service/data/repositories
 */

import { PrismaClient, Prisma } from '@prisma/client';
import { User } from '../../domain/entities/User';
import { Email } from '../../domain/valueObjects/Email';
import { IUserRepository } from '../../domain/repositories/IUserRepository';
import { DatabaseConnection } from '@shield/shared/database/DatabaseConnection';
import { isNotNull } from '@shield/shared/utils/guards';
import {
  DatabaseError,
  handleUnknownError,
} from '@shield/shared/errors';

/**
 * User Repository Implementation
 */
export class UserRepository implements IUserRepository {
  private get prisma(): PrismaClient {
    return DatabaseConnection.getInstance().getClient();
  }

  /**
   * Finds a user by email
   */
  public async findByEmail(email: Email): Promise<User | null> {
    try {
      const userData = await this.prisma.user.findUnique({
        where: { email: email.getValue() },
      });

      if (!isNotNull(userData)) {
        return null;
      }

      return User.fromPersistence({
        id: userData.id,
        email: userData.email,
        password: userData.password,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(
          `Database query failed: ${error.message}`,
          'findByEmail',
          { email: email.getValue(), code: error.code, meta: error.meta }
        );
      }

      throw handleUnknownError(error, 'Failed to find user by email', {
        email: email.getValue(),
        operation: 'findByEmail',
      });
    }
  }

  /**
   * Finds a user by ID
   */
  public async findById(id: string): Promise<User | null> {
    try {
      const userData = await this.prisma.user.findUnique({
        where: { id },
      });

      if (!isNotNull(userData)) {
        return null;
      }

      return User.fromPersistence({
        id: userData.id,
        email: userData.email,
        password: userData.password,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(
          `Database query failed: ${error.message}`,
          'findById',
          { id, code: error.code, meta: error.meta }
        );
      }

      throw handleUnknownError(error, 'Failed to find user by ID', {
        id,
        operation: 'findById',
      });
    }
  }

  /**
   * Saves a new user
   */
  public async save(user: User): Promise<User> {
    try {
      const userData = await this.prisma.user.create({
        data: {
          id: user.id,
          email: user.email,
          password: user.hashedPassword,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      });

      return User.fromPersistence({
        id: userData.id,
        email: userData.email,
        password: userData.password,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(
          `Database create failed: ${error.message}`,
          'save',
          { userId: user.id, email: user.email, code: error.code, meta: error.meta }
        );
      }

      throw handleUnknownError(error, 'Failed to save user', {
        userId: user.id,
        email: user.email,
        operation: 'save',
      });
    }
  }

  /**
   * Checks if a user exists with the given email
   */
  public async existsByEmail(email: Email): Promise<boolean> {
    try {
      const count = await this.prisma.user.count({
        where: { email: email.getValue() },
      });
      return count > 0;
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(
          `Database query failed: ${error.message}`,
          'existsByEmail',
          { email: email.getValue(), code: error.code, meta: error.meta }
        );
      }

      throw handleUnknownError(error, 'Failed to check if user exists', {
        email: email.getValue(),
        operation: 'existsByEmail',
      });
    }
  }

  /**
   * Updates an existing user
   */
  public async update(user: User): Promise<User> {
    try {
      const userData = await this.prisma.user.update({
        where: { id: user.id },
        data: {
          email: user.email,
          password: user.hashedPassword,
          updatedAt: new Date(),
        },
      });

      return User.fromPersistence({
        id: userData.id,
        email: userData.email,
        password: userData.password,
        createdAt: userData.createdAt,
        updatedAt: userData.updatedAt,
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(
          `Database update failed: ${error.message}`,
          'update',
          { userId: user.id, email: user.email, code: error.code, meta: error.meta }
        );
      }

      throw handleUnknownError(error, 'Failed to update user', {
        userId: user.id,
        email: user.email,
        operation: 'update',
      });
    }
  }

  /**
   * Deletes a user by ID
   */
  public async delete(id: string): Promise<void> {
    try {
      await this.prisma.user.delete({
        where: { id },
      });
    } catch (error: unknown) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new DatabaseError(
          `Database delete failed: ${error.message}`,
          'delete',
          { id, code: error.code, meta: error.meta }
        );
      }

      throw handleUnknownError(error, 'Failed to delete user', {
        id,
        operation: 'delete',
      });
    }
  }
}

