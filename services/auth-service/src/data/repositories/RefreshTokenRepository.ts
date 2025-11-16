/**
 * RefreshToken Repository Implementation
 * 
 * Prisma-based implementation of IRefreshTokenRepository
 * 
 * @module auth-service/data/repositories
 */

import { PrismaClient } from '@prisma/client';
import { RefreshToken } from '../../domain/entities/RefreshToken';
import { IRefreshTokenRepository } from '../../domain/repositories/IRefreshTokenRepository';
import { DatabaseConnection } from '@shield/shared/database/DatabaseConnection';
import { isNotNull } from '@shield/shared/utils/guards';

/**
 * RefreshToken Repository Implementation
 */
export class RefreshTokenRepository implements IRefreshTokenRepository {
  private get prisma(): PrismaClient {
    return DatabaseConnection.getInstance().getClient();
  }

  /**
   * Finds a refresh token by token string
   */
  public async findByToken(token: string): Promise<RefreshToken | null> {
    const tokenData = await this.prisma.refreshToken.findUnique({
      where: { token },
      include: { user: true },
    });

    if (!isNotNull(tokenData)) {
      return null;
    }

    return RefreshToken.fromPersistence({
      id: tokenData.id,
      userId: tokenData.userId,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      createdAt: tokenData.createdAt,
    });
  }

  /**
   * Finds a refresh token by ID
   */
  public async findById(id: string): Promise<RefreshToken | null> {
    const tokenData = await this.prisma.refreshToken.findUnique({
      where: { id },
    });

    if (!isNotNull(tokenData)) {
      return null;
    }

    return RefreshToken.fromPersistence({
      id: tokenData.id,
      userId: tokenData.userId,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      createdAt: tokenData.createdAt,
    });
  }

  /**
   * Finds all refresh tokens for a user
   */
  public async findByUserId(userId: string): Promise<RefreshToken[]> {
    const tokensData = await this.prisma.refreshToken.findMany({
      where: { userId },
    });

    return tokensData.map((tokenData) =>
      RefreshToken.fromPersistence({
        id: tokenData.id,
        userId: tokenData.userId,
        token: tokenData.token,
        expiresAt: tokenData.expiresAt,
        createdAt: tokenData.createdAt,
      })
    );
  }

  /**
   * Saves a new refresh token
   */
  public async save(token: RefreshToken): Promise<RefreshToken> {
    const tokenData = await this.prisma.refreshToken.create({
      data: {
        id: token.id,
        userId: token.userId,
        token: token.token,
        expiresAt: token.expiresAt,
        createdAt: token.createdAt,
      },
    });

    return RefreshToken.fromPersistence({
      id: tokenData.id,
      userId: tokenData.userId,
      token: tokenData.token,
      expiresAt: tokenData.expiresAt,
      createdAt: tokenData.createdAt,
    });
  }

  /**
   * Deletes a refresh token by token string
   */
  public async deleteByToken(token: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { token },
    });
  }

  /**
   * Deletes a refresh token by ID
   */
  public async deleteById(id: string): Promise<void> {
    await this.prisma.refreshToken.delete({
      where: { id },
    });
  }

  /**
   * Deletes all expired tokens
   */
  public async deleteExpired(): Promise<number> {
    const result = await this.prisma.refreshToken.deleteMany({
      where: {
        expiresAt: {
          lt: new Date(),
        },
      },
    });
    return result.count;
  }

  /**
   * Deletes all tokens for a user
   */
  public async deleteByUserId(userId: string): Promise<void> {
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });
  }
}

