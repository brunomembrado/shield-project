/**
 * Wallet Domain Entity
 * 
 * Represents a wallet in the domain layer
 * 
 * @module wallet-service/domain/entities
 */

import { v4 as uuidv4 } from 'uuid';
import { ChainType } from '@shield/shared/types';
import { isNotNull, isNonEmptyString, isValidUUID } from '@shield/shared/utils/guards';
import { isValidEthereumAddress, isValidTronAddress } from '@shield/shared/utils';

/**
 * Wallet domain entity
 */
export class Wallet {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly tag: string | null,
    public readonly chain: ChainType,
    public readonly address: string,
    public readonly isActive: boolean,
    public readonly createdAt: Date,
    public readonly updatedAt: Date,
    // Encrypted private key storage (only for system-generated wallets)
    public readonly privateKeyEncrypted: string | null = null,
    public readonly encryptionIv: string | null = null,
    public readonly encryptionSalt: string | null = null,
    public readonly createdBySystem: boolean = false
  ) {
    this.validate();
  }

  /**
   * Creates a new Wallet entity
   */
  public static create(
    id: string,
    userId: string,
    chain: ChainType,
    address: string,
    tag: string | null = null,
    isActive: boolean = true,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date(),
    privateKeyEncrypted: string | null = null,
    encryptionIv: string | null = null,
    encryptionSalt: string | null = null,
    createdBySystem: boolean = false
  ): Wallet {
    return new Wallet(
      id,
      userId,
      tag,
      chain,
      address,
      isActive,
      createdAt,
      updatedAt,
      privateKeyEncrypted,
      encryptionIv,
      encryptionSalt,
      createdBySystem
    );
  }

  /**
   * Creates a new system-generated Wallet with encrypted private key
   * This is a convenience method for wallets created by our system
   */
  public static createWithEncryption(data: {
    userId: string;
    chain: ChainType;
    address: string;
    privateKeyEncrypted: string;
    encryptionIv: string;
    encryptionSalt: string;
    tag?: string;
  }): Wallet {
    return new Wallet(
      uuidv4(),
      data.userId,
      data.tag ?? null,
      data.chain,
      data.address,
      true, // isActive
      new Date(), // createdAt
      new Date(), // updatedAt
      data.privateKeyEncrypted,
      data.encryptionIv,
      data.encryptionSalt,
      true // createdBySystem
    );
  }

  /**
   * Reconstructs Wallet from persistence layer
   */
  public static fromPersistence(data: {
    id: string;
    userId: string;
    tag: string | null;
    chain: ChainType;
    address: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    privateKeyEncrypted?: string | null;
    encryptionIv?: string | null;
    encryptionSalt?: string | null;
    createdBySystem?: boolean;
  }): Wallet {
    return new Wallet(
      data.id,
      data.userId,
      data.tag,
      data.chain,
      data.address,
      data.isActive,
      data.createdAt,
      data.updatedAt,
      data.privateKeyEncrypted ?? null,
      data.encryptionIv ?? null,
      data.encryptionSalt ?? null,
      data.createdBySystem ?? false
    );
  }

  /**
   * Validates wallet entity invariants
   */
  private validate(): void {
    if (!isValidUUID(this.id)) {
      throw new Error('Wallet ID must be a valid UUID');
    }

    if (!isValidUUID(this.userId)) {
      throw new Error('Wallet userId must be a valid UUID');
    }

    if (!isNonEmptyString(this.address)) {
      throw new Error('Wallet address cannot be empty');
    }

    // Validate address format based on chain
    if (this.chain === ChainType.POLYGON && !isValidEthereumAddress(this.address)) {
      throw new Error('Invalid Polygon wallet address format');
    }

    if (this.chain === ChainType.TRON && !isValidTronAddress(this.address)) {
      throw new Error('Invalid Tron wallet address format');
    }

    if (!isNotNull(this.createdAt) || !isNotNull(this.updatedAt)) {
      throw new Error('Wallet timestamps cannot be null');
    }
  }

  /**
   * Activates the wallet
   */
  public activate(): Wallet {
    return new Wallet(
      this.id,
      this.userId,
      this.tag,
      this.chain,
      this.address,
      true,
      this.createdAt,
      new Date(),
      this.privateKeyEncrypted,
      this.encryptionIv,
      this.encryptionSalt,
      this.createdBySystem
    );
  }

  /**
   * Deactivates the wallet
   */
  public deactivate(): Wallet {
    return new Wallet(
      this.id,
      this.userId,
      this.tag,
      this.chain,
      this.address,
      false,
      this.createdAt,
      new Date(),
      this.privateKeyEncrypted,
      this.encryptionIv,
      this.encryptionSalt,
      this.createdBySystem
    );
  }

  /**
   * Updates the wallet tag
   */
  public updateTag(tag: string | null): Wallet {
    return new Wallet(
      this.id,
      this.userId,
      tag,
      this.chain,
      this.address,
      this.isActive,
      this.createdAt,
      new Date(),
      this.privateKeyEncrypted,
      this.encryptionIv,
      this.encryptionSalt,
      this.createdBySystem
    );
  }

  /**
   * Checks if wallet is equal to another wallet
   */
  public equals(other: Wallet): boolean {
    return this.id === other.id && this.address === other.address;
  }

  /**
   * Converts to plain object for serialization
   * NOTE: NEVER includes encrypted private key for security
   */
  public toPlainObject(): {
    id: string;
    userId: string;
    tag: string | null;
    chain: ChainType;
    address: string;
    isActive: boolean;
    createdBySystem: boolean; // Indicates if private key is stored (can be revealed)
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      userId: this.userId,
      tag: this.tag,
      chain: this.chain,
      address: this.address,
      isActive: this.isActive,
      createdBySystem: this.createdBySystem, // Client needs this to know if private key can be revealed
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      // SECURITY: Never include privateKeyEncrypted, encryptionIv, encryptionSalt
    };
  }
}

