/**
 * Wallet Domain Entity
 * 
 * Represents a wallet in the domain layer
 * 
 * @module wallet-service/domain/entities
 */

import { ChainType } from '../../../../shared/types';
import { isNotNull, isNonEmptyString, isValidUUID } from '../../../../shared/utils/guards';
import { isValidEthereumAddress, isValidTronAddress } from '../../../../shared/utils';

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
    public readonly updatedAt: Date
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
    updatedAt: Date = new Date()
  ): Wallet {
    return new Wallet(id, userId, tag, chain, address, isActive, createdAt, updatedAt);
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
  }): Wallet {
    return new Wallet(
      data.id,
      data.userId,
      data.tag,
      data.chain,
      data.address,
      data.isActive,
      data.createdAt,
      data.updatedAt
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
      new Date()
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
      new Date()
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
      new Date()
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
   */
  public toPlainObject(): {
    id: string;
    userId: string;
    tag: string | null;
    chain: ChainType;
    address: string;
    isActive: boolean;
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
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

