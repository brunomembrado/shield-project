/**
 * Wallet Repository Implementation
 * 
 * Prisma-based implementation of IWalletRepository
 * 
 * @module wallet-service/data/repositories
 */

import { PrismaClient } from '@prisma/client';
import { Wallet } from '../../domain/entities/Wallet';
import { IWalletRepository, WalletFilters } from '../../domain/repositories/IWalletRepository';
import { ChainType } from '@shield/shared/types';
import { DatabaseConnection } from '@shield/shared/database/DatabaseConnection';
import { isNotNull } from '@shield/shared/utils/guards';

/**
 * Wallet Repository Implementation
 */
export class WalletRepository implements IWalletRepository {
  private get prisma(): PrismaClient {
    return DatabaseConnection.getInstance().getClient();
  }

  /**
   * Finds a wallet by ID
   */
  public async findById(id: string): Promise<Wallet | null> {
    const walletData = await this.prisma.wallet.findUnique({
      where: { id },
    });

    if (!isNotNull(walletData)) {
      return null;
    }

    return Wallet.fromPersistence({
      id: walletData.id,
      userId: walletData.userId,
      tag: walletData.tag,
      chain: walletData.chain as ChainType,
      address: walletData.address,
      isActive: walletData.isActive,
      createdAt: walletData.createdAt,
      updatedAt: walletData.updatedAt,
      privateKeyEncrypted: walletData.privateKeyEncrypted,
      encryptionIv: walletData.encryptionIv,
      encryptionSalt: walletData.encryptionSalt,
      createdBySystem: walletData.createdBySystem,
    });
  }

  /**
   * Finds a wallet by ID and user ID (ensures ownership)
   */
  public async findByIdAndUserId(id: string, userId: string): Promise<Wallet | null> {
    const walletData = await this.prisma.wallet.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!isNotNull(walletData)) {
      return null;
    }

    return Wallet.fromPersistence({
      id: walletData.id,
      userId: walletData.userId,
      tag: walletData.tag,
      chain: walletData.chain as ChainType,
      address: walletData.address,
      isActive: walletData.isActive,
      createdAt: walletData.createdAt,
      updatedAt: walletData.updatedAt,
      privateKeyEncrypted: walletData.privateKeyEncrypted,
      encryptionIv: walletData.encryptionIv,
      encryptionSalt: walletData.encryptionSalt,
      createdBySystem: walletData.createdBySystem,
    });
  }

  /**
   * Finds all wallets for a user
   */
  public async findByUserId(userId: string, filters?: WalletFilters): Promise<Wallet[]> {
    const where: {
      userId: string;
      chain?: ChainType;
      isActive?: boolean;
    } = { userId };

    if (isNotNull(filters?.chain)) {
      where.chain = filters.chain;
    }

    if (isNotNull(filters?.isActive)) {
      where.isActive = filters.isActive;
    }

    const walletsData = await this.prisma.wallet.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    return walletsData.map((walletData) =>
      Wallet.fromPersistence({
        id: walletData.id,
        userId: walletData.userId,
        tag: walletData.tag,
        chain: walletData.chain as ChainType,
        address: walletData.address,
        isActive: walletData.isActive,
        createdAt: walletData.createdAt,
        updatedAt: walletData.updatedAt,
        privateKeyEncrypted: walletData.privateKeyEncrypted,
        encryptionIv: walletData.encryptionIv,
        encryptionSalt: walletData.encryptionSalt,
        createdBySystem: walletData.createdBySystem,
      })
    );
  }

  /**
   * Finds a wallet by address and user ID
   */
  public async findByAddressAndUserId(
    address: string,
    userId: string
  ): Promise<Wallet | null> {
    const walletData = await this.prisma.wallet.findFirst({
      where: {
        address,
        userId,
      },
    });

    if (!isNotNull(walletData)) {
      return null;
    }

    return Wallet.fromPersistence({
      id: walletData.id,
      userId: walletData.userId,
      tag: walletData.tag,
      chain: walletData.chain as ChainType,
      address: walletData.address,
      isActive: walletData.isActive,
      createdAt: walletData.createdAt,
      updatedAt: walletData.updatedAt,
      privateKeyEncrypted: walletData.privateKeyEncrypted,
      encryptionIv: walletData.encryptionIv,
      encryptionSalt: walletData.encryptionSalt,
      createdBySystem: walletData.createdBySystem,
    });
  }

  /**
   * Saves a new wallet
   */
  public async save(wallet: Wallet): Promise<Wallet> {
    const walletData = await this.prisma.wallet.create({
      data: {
        id: wallet.id,
        userId: wallet.userId,
        tag: wallet.tag,
        chain: wallet.chain,
        address: wallet.address,
        isActive: wallet.isActive,
        createdAt: wallet.createdAt,
        updatedAt: wallet.updatedAt,
        // Encrypted private key fields (for system-generated wallets)
        privateKeyEncrypted: wallet.privateKeyEncrypted,
        encryptionIv: wallet.encryptionIv,
        encryptionSalt: wallet.encryptionSalt,
        createdBySystem: wallet.createdBySystem,
      },
    });

    return Wallet.fromPersistence({
      id: walletData.id,
      userId: walletData.userId,
      tag: walletData.tag,
      chain: walletData.chain as ChainType,
      address: walletData.address,
      isActive: walletData.isActive,
      createdAt: walletData.createdAt,
      updatedAt: walletData.updatedAt,
      privateKeyEncrypted: walletData.privateKeyEncrypted,
      encryptionIv: walletData.encryptionIv,
      encryptionSalt: walletData.encryptionSalt,
      createdBySystem: walletData.createdBySystem,
    });
  }

  /**
   * Updates an existing wallet
   */
  public async update(wallet: Wallet): Promise<Wallet> {
    const walletData = await this.prisma.wallet.update({
      where: { id: wallet.id },
      data: {
        tag: wallet.tag,
        isActive: wallet.isActive,
        updatedAt: wallet.updatedAt,
      },
    });

    return Wallet.fromPersistence({
      id: walletData.id,
      userId: walletData.userId,
      tag: walletData.tag,
      chain: walletData.chain as ChainType,
      address: walletData.address,
      isActive: walletData.isActive,
      createdAt: walletData.createdAt,
      updatedAt: walletData.updatedAt,
      privateKeyEncrypted: walletData.privateKeyEncrypted,
      encryptionIv: walletData.encryptionIv,
      encryptionSalt: walletData.encryptionSalt,
      createdBySystem: walletData.createdBySystem,
    });
  }

  /**
   * Deletes a wallet by ID
   */
  public async delete(id: string): Promise<void> {
    await this.prisma.wallet.delete({
      where: { id },
    });
  }

  /**
   * Checks if a wallet exists with the given address for the user
   */
  public async existsByAddressAndUserId(address: string, userId: string): Promise<boolean> {
    const count = await this.prisma.wallet.count({
      where: {
        address,
        userId,
      },
    });
    return count > 0;
  }
}

