/**
 * Transaction Domain Entity
 * 
 * Represents a transaction in the domain layer
 * 
 * @module transaction-service/domain/entities
 */

import { ChainType, TransactionStatus } from '../../../../shared/types';
import { isNotNull, isNonEmptyString, isValidUUID, isPositiveNumber } from '../../../../shared/utils/guards';

/**
 * Transaction domain entity
 */
export class Transaction {
  private constructor(
    public readonly id: string,
    public readonly userId: string,
    public readonly walletId: string,
    public readonly chain: ChainType,
    public readonly toAddress: string,
    public readonly amountUSDT: string,
    public readonly amountUSD: string,
    public readonly exchangeRate: string,
    public readonly serviceFeePercentage: string,
    public readonly serviceFee: string,
    public readonly netAmount: string,
    public readonly status: TransactionStatus,
    public readonly txHash: string | null,
    public readonly fromAddress: string | null,
    public readonly bankAccountName: string | null,
    public readonly bankAccountNumber: string | null,
    public readonly bankRoutingNumber: string | null,
    public readonly bankWireReference: string | null,
    public readonly complianceCheckId: string | null,
    public readonly complianceStatus: string | null,
    public readonly notes: string | null,
    public readonly createdAt: Date,
    public readonly updatedAt: Date
  ) {
    this.validate();
  }

  /**
   * Creates a new Transaction entity
   */
  public static create(
    id: string,
    userId: string,
    walletId: string,
    chain: ChainType,
    toAddress: string,
    amountUSDT: string,
    amountUSD: string,
    exchangeRate: string,
    serviceFeePercentage: string,
    serviceFee: string,
    netAmount: string,
    bankAccountName: string,
    bankAccountNumber: string,
    bankRoutingNumber: string | null = null,
    createdAt: Date = new Date(),
    updatedAt: Date = new Date()
  ): Transaction {
    return new Transaction(
      id,
      userId,
      walletId,
      chain,
      toAddress,
      amountUSDT,
      amountUSD,
      exchangeRate,
      serviceFeePercentage,
      serviceFee,
      netAmount,
      TransactionStatus.PENDING,
      null,
      null,
      bankAccountName,
      bankAccountNumber,
      bankRoutingNumber,
      null,
      null,
      null,
      null,
      createdAt,
      updatedAt
    );
  }

  /**
   * Reconstructs Transaction from persistence layer
   */
  public static fromPersistence(data: {
    id: string;
    userId: string;
    walletId: string;
    chain: ChainType;
    toAddress: string;
    amountUSDT: string;
    amountUSD: string;
    exchangeRate: string;
    serviceFeePercentage: string;
    serviceFee: string;
    netAmount: string;
    status: TransactionStatus;
    txHash: string | null;
    fromAddress: string | null;
    bankAccountName: string | null;
    bankAccountNumber: string | null;
    bankRoutingNumber: string | null;
    bankWireReference: string | null;
    complianceCheckId: string | null;
    complianceStatus: string | null;
    notes: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Transaction {
    return new Transaction(
      data.id,
      data.userId,
      data.walletId,
      data.chain,
      data.toAddress,
      data.amountUSDT,
      data.amountUSD,
      data.exchangeRate,
      data.serviceFeePercentage,
      data.serviceFee,
      data.netAmount,
      data.status,
      data.txHash,
      data.fromAddress,
      data.bankAccountName,
      data.bankAccountNumber,
      data.bankRoutingNumber,
      data.bankWireReference,
      data.complianceCheckId,
      data.complianceStatus,
      data.notes,
      data.createdAt,
      data.updatedAt
    );
  }

  /**
   * Validates transaction entity invariants
   */
  private validate(): void {
    if (!isValidUUID(this.id)) {
      throw new Error('Transaction ID must be a valid UUID');
    }

    if (!isValidUUID(this.userId)) {
      throw new Error('Transaction userId must be a valid UUID');
    }

    if (!isValidUUID(this.walletId)) {
      throw new Error('Transaction walletId must be a valid UUID');
    }

    if (!isNonEmptyString(this.toAddress)) {
      throw new Error('Transaction toAddress cannot be empty');
    }

    if (!isPositiveNumber(parseFloat(this.amountUSDT))) {
      throw new Error('Transaction amountUSDT must be positive');
    }

    if (!isPositiveNumber(parseFloat(this.amountUSD))) {
      throw new Error('Transaction amountUSD must be positive');
    }

    if (!isNotNull(this.createdAt) || !isNotNull(this.updatedAt)) {
      throw new Error('Transaction timestamps cannot be null');
    }
  }

  /**
   * Updates transaction status
   */
  public updateStatus(status: TransactionStatus): Transaction {
    return new Transaction(
      this.id,
      this.userId,
      this.walletId,
      this.chain,
      this.toAddress,
      this.amountUSDT,
      this.amountUSD,
      this.exchangeRate,
      this.serviceFeePercentage,
      this.serviceFee,
      this.netAmount,
      status,
      this.txHash,
      this.fromAddress,
      this.bankAccountName,
      this.bankAccountNumber,
      this.bankRoutingNumber,
      this.bankWireReference,
      this.complianceCheckId,
      this.complianceStatus,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Updates transaction hash and from address
   */
  public updateBlockchainDetails(txHash: string, fromAddress: string): Transaction {
    return new Transaction(
      this.id,
      this.userId,
      this.walletId,
      this.chain,
      this.toAddress,
      this.amountUSDT,
      this.amountUSD,
      this.exchangeRate,
      this.serviceFeePercentage,
      this.serviceFee,
      this.netAmount,
      this.status,
      txHash,
      fromAddress,
      this.bankAccountName,
      this.bankAccountNumber,
      this.bankRoutingNumber,
      this.bankWireReference,
      this.complianceCheckId,
      this.complianceStatus,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Updates compliance details
   */
  public updateComplianceDetails(
    complianceCheckId: string,
    complianceStatus: string
  ): Transaction {
    return new Transaction(
      this.id,
      this.userId,
      this.walletId,
      this.chain,
      this.toAddress,
      this.amountUSDT,
      this.amountUSD,
      this.exchangeRate,
      this.serviceFeePercentage,
      this.serviceFee,
      this.netAmount,
      this.status,
      this.txHash,
      this.fromAddress,
      this.bankAccountName,
      this.bankAccountNumber,
      this.bankRoutingNumber,
      this.bankWireReference,
      complianceCheckId,
      complianceStatus,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Updates bank wire reference
   */
  public updateBankWireReference(bankWireReference: string): Transaction {
    return new Transaction(
      this.id,
      this.userId,
      this.walletId,
      this.chain,
      this.toAddress,
      this.amountUSDT,
      this.amountUSD,
      this.exchangeRate,
      this.serviceFeePercentage,
      this.serviceFee,
      this.netAmount,
      this.status,
      this.txHash,
      this.fromAddress,
      this.bankAccountName,
      this.bankAccountNumber,
      this.bankRoutingNumber,
      bankWireReference,
      this.complianceCheckId,
      this.complianceStatus,
      this.notes,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Updates notes
   */
  public updateNotes(notes: string | null): Transaction {
    return new Transaction(
      this.id,
      this.userId,
      this.walletId,
      this.chain,
      this.toAddress,
      this.amountUSDT,
      this.amountUSD,
      this.exchangeRate,
      this.serviceFeePercentage,
      this.serviceFee,
      this.netAmount,
      this.status,
      this.txHash,
      this.fromAddress,
      this.bankAccountName,
      this.bankAccountNumber,
      this.bankRoutingNumber,
      this.bankWireReference,
      this.complianceCheckId,
      this.complianceStatus,
      notes,
      this.createdAt,
      new Date()
    );
  }

  /**
   * Checks if transaction is equal to another transaction
   */
  public equals(other: Transaction): boolean {
    return this.id === other.id && this.txHash === other.txHash;
  }

  /**
   * Converts to plain object for serialization
   */
  public toPlainObject(): Record<string, unknown> {
    return {
      id: this.id,
      userId: this.userId,
      walletId: this.walletId,
      chain: this.chain,
      txHash: this.txHash,
      fromAddress: this.fromAddress,
      toAddress: this.toAddress,
      amountUSDT: this.amountUSDT,
      amountUSD: this.amountUSD,
      exchangeRate: this.exchangeRate,
      serviceFee: this.serviceFee,
      netAmount: this.netAmount,
      status: this.status,
      bankAccountName: this.bankAccountName,
      bankAccountNumber: this.bankAccountNumber,
      bankRoutingNumber: this.bankRoutingNumber,
      bankWireReference: this.bankWireReference,
      complianceCheckId: this.complianceCheckId,
      complianceStatus: this.complianceStatus,
      notes: this.notes,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

