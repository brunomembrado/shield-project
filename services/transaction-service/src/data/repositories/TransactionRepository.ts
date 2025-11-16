/**
 * Transaction Repository Implementation
 * 
 * Prisma-based implementation of ITransactionRepository
 * 
 * @module transaction-service/data/repositories
 */

import { PrismaClient } from '@prisma/client';
import { Transaction } from '../../domain/entities/Transaction';
import { ITransactionRepository, TransactionFilters } from '../../domain/repositories/ITransactionRepository';
import { ChainType, TransactionStatus } from '../../../../shared/types';
import { DatabaseConnection } from '../../../../shared/database/DatabaseConnection';
import { isNotNull } from '../../../../shared/utils/guards';

/**
 * Transaction Repository Implementation
 */
export class TransactionRepository implements ITransactionRepository {
  private get prisma(): PrismaClient {
    return DatabaseConnection.getInstance().getClient();
  }

  /**
   * Finds a transaction by ID
   */
  public async findById(id: string): Promise<Transaction | null> {
    const transactionData = await this.prisma.transaction.findUnique({
      where: { id },
    });

    if (!isNotNull(transactionData)) {
      return null;
    }

    return Transaction.fromPersistence({
      id: transactionData.id,
      userId: transactionData.userId,
      walletId: transactionData.walletId,
      chain: transactionData.chain as ChainType,
      toAddress: transactionData.toAddress,
      amountUSDT: transactionData.amountUSDT,
      amountUSD: transactionData.amountUSD,
      exchangeRate: transactionData.exchangeRate,
      serviceFeePercentage: transactionData.serviceFeePercentage,
      serviceFee: transactionData.serviceFee,
      netAmount: transactionData.netAmount,
      status: transactionData.status as TransactionStatus,
      txHash: transactionData.txHash,
      fromAddress: transactionData.fromAddress,
      bankAccountName: transactionData.bankAccountName,
      bankAccountNumber: transactionData.bankAccountNumber,
      bankRoutingNumber: transactionData.bankRoutingNumber,
      bankWireReference: transactionData.bankWireReference,
      complianceCheckId: transactionData.complianceCheckId,
      complianceStatus: transactionData.complianceStatus,
      notes: transactionData.notes,
      createdAt: transactionData.createdAt,
      updatedAt: transactionData.updatedAt,
    });
  }

  /**
   * Finds a transaction by ID and user ID (ensures ownership)
   */
  public async findByIdAndUserId(id: string, userId: string): Promise<Transaction | null> {
    const transactionData = await this.prisma.transaction.findFirst({
      where: {
        id,
        userId,
      },
    });

    if (!isNotNull(transactionData)) {
      return null;
    }

    return Transaction.fromPersistence({
      id: transactionData.id,
      userId: transactionData.userId,
      walletId: transactionData.walletId,
      chain: transactionData.chain as ChainType,
      toAddress: transactionData.toAddress,
      amountUSDT: transactionData.amountUSDT,
      amountUSD: transactionData.amountUSD,
      exchangeRate: transactionData.exchangeRate,
      serviceFeePercentage: transactionData.serviceFeePercentage,
      serviceFee: transactionData.serviceFee,
      netAmount: transactionData.netAmount,
      status: transactionData.status as TransactionStatus,
      txHash: transactionData.txHash,
      fromAddress: transactionData.fromAddress,
      bankAccountName: transactionData.bankAccountName,
      bankAccountNumber: transactionData.bankAccountNumber,
      bankRoutingNumber: transactionData.bankRoutingNumber,
      bankWireReference: transactionData.bankWireReference,
      complianceCheckId: transactionData.complianceCheckId,
      complianceStatus: transactionData.complianceStatus,
      notes: transactionData.notes,
      createdAt: transactionData.createdAt,
      updatedAt: transactionData.updatedAt,
    });
  }

  /**
   * Finds a transaction by transaction hash
   */
  public async findByTxHash(txHash: string): Promise<Transaction | null> {
    const transactionData = await this.prisma.transaction.findUnique({
      where: { txHash },
    });

    if (!isNotNull(transactionData)) {
      return null;
    }

    return Transaction.fromPersistence({
      id: transactionData.id,
      userId: transactionData.userId,
      walletId: transactionData.walletId,
      chain: transactionData.chain as ChainType,
      toAddress: transactionData.toAddress,
      amountUSDT: transactionData.amountUSDT,
      amountUSD: transactionData.amountUSD,
      exchangeRate: transactionData.exchangeRate,
      serviceFeePercentage: transactionData.serviceFeePercentage,
      serviceFee: transactionData.serviceFee,
      netAmount: transactionData.netAmount,
      status: transactionData.status as TransactionStatus,
      txHash: transactionData.txHash,
      fromAddress: transactionData.fromAddress,
      bankAccountName: transactionData.bankAccountName,
      bankAccountNumber: transactionData.bankAccountNumber,
      bankRoutingNumber: transactionData.bankRoutingNumber,
      bankWireReference: transactionData.bankWireReference,
      complianceCheckId: transactionData.complianceCheckId,
      complianceStatus: transactionData.complianceStatus,
      notes: transactionData.notes,
      createdAt: transactionData.createdAt,
      updatedAt: transactionData.updatedAt,
    });
  }

  /**
   * Finds all transactions for a user
   */
  public async findByUserId(
    userId: string,
    filters?: TransactionFilters
  ): Promise<Transaction[]> {
    const where: {
      userId: string;
      chain?: ChainType;
      status?: TransactionStatus;
    } = { userId };

    if (isNotNull(filters?.chain)) {
      where.chain = filters.chain;
    }

    if (isNotNull(filters?.status)) {
      where.status = filters.status;
    }

    const transactionsData = await this.prisma.transaction.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      take: filters?.limit || 20,
      skip: filters?.offset || 0,
    });

    return transactionsData.map((transactionData) =>
      Transaction.fromPersistence({
        id: transactionData.id,
        userId: transactionData.userId,
        walletId: transactionData.walletId,
        chain: transactionData.chain as ChainType,
        toAddress: transactionData.toAddress,
        amountUSDT: transactionData.amountUSDT,
        amountUSD: transactionData.amountUSD,
        exchangeRate: transactionData.exchangeRate,
        serviceFeePercentage: transactionData.serviceFeePercentage,
        serviceFee: transactionData.serviceFee,
        netAmount: transactionData.netAmount,
        status: transactionData.status as TransactionStatus,
        txHash: transactionData.txHash,
        fromAddress: transactionData.fromAddress,
        bankAccountName: transactionData.bankAccountName,
        bankAccountNumber: transactionData.bankAccountNumber,
        bankRoutingNumber: transactionData.bankRoutingNumber,
        bankWireReference: transactionData.bankWireReference,
        complianceCheckId: transactionData.complianceCheckId,
        complianceStatus: transactionData.complianceStatus,
        notes: transactionData.notes,
        createdAt: transactionData.createdAt,
        updatedAt: transactionData.updatedAt,
      })
    );
  }

  /**
   * Counts transactions for a user
   */
  public async countByUserId(userId: string, filters?: TransactionFilters): Promise<number> {
    const where: {
      userId: string;
      chain?: ChainType;
      status?: TransactionStatus;
    } = { userId };

    if (isNotNull(filters?.chain)) {
      where.chain = filters.chain;
    }

    if (isNotNull(filters?.status)) {
      where.status = filters.status;
    }

    return this.prisma.transaction.count({ where });
  }

  /**
   * Saves a new transaction
   */
  public async save(transaction: Transaction): Promise<Transaction> {
    const transactionData = await this.prisma.transaction.create({
      data: {
        id: transaction.id,
        userId: transaction.userId,
        walletId: transaction.walletId,
        chain: transaction.chain,
        toAddress: transaction.toAddress,
        amountUSDT: transaction.amountUSDT,
        amountUSD: transaction.amountUSD,
        exchangeRate: transaction.exchangeRate,
        serviceFeePercentage: transaction.serviceFeePercentage,
        serviceFee: transaction.serviceFee,
        netAmount: transaction.netAmount,
        status: transaction.status,
        txHash: transaction.txHash,
        fromAddress: transaction.fromAddress,
        bankAccountName: transaction.bankAccountName,
        bankAccountNumber: transaction.bankAccountNumber,
        bankRoutingNumber: transaction.bankRoutingNumber,
        bankWireReference: transaction.bankWireReference,
        complianceCheckId: transaction.complianceCheckId,
        complianceStatus: transaction.complianceStatus,
        notes: transaction.notes,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
      },
    });

    return Transaction.fromPersistence({
      id: transactionData.id,
      userId: transactionData.userId,
      walletId: transactionData.walletId,
      chain: transactionData.chain as ChainType,
      toAddress: transactionData.toAddress,
      amountUSDT: transactionData.amountUSDT,
      amountUSD: transactionData.amountUSD,
      exchangeRate: transactionData.exchangeRate,
      serviceFeePercentage: transactionData.serviceFeePercentage,
      serviceFee: transactionData.serviceFee,
      netAmount: transactionData.netAmount,
      status: transactionData.status as TransactionStatus,
      txHash: transactionData.txHash,
      fromAddress: transactionData.fromAddress,
      bankAccountName: transactionData.bankAccountName,
      bankAccountNumber: transactionData.bankAccountNumber,
      bankRoutingNumber: transactionData.bankRoutingNumber,
      bankWireReference: transactionData.bankWireReference,
      complianceCheckId: transactionData.complianceCheckId,
      complianceStatus: transactionData.complianceStatus,
      notes: transactionData.notes,
      createdAt: transactionData.createdAt,
      updatedAt: transactionData.updatedAt,
    });
  }

  /**
   * Updates an existing transaction
   */
  public async update(transaction: Transaction): Promise<Transaction> {
    const transactionData = await this.prisma.transaction.update({
      where: { id: transaction.id },
      data: {
        status: transaction.status,
        txHash: transaction.txHash,
        fromAddress: transaction.fromAddress,
        bankWireReference: transaction.bankWireReference,
        complianceCheckId: transaction.complianceCheckId,
        complianceStatus: transaction.complianceStatus,
        notes: transaction.notes,
        updatedAt: transaction.updatedAt,
      },
    });

    return Transaction.fromPersistence({
      id: transactionData.id,
      userId: transactionData.userId,
      walletId: transactionData.walletId,
      chain: transactionData.chain as ChainType,
      toAddress: transactionData.toAddress,
      amountUSDT: transactionData.amountUSDT,
      amountUSD: transactionData.amountUSD,
      exchangeRate: transactionData.exchangeRate,
      serviceFeePercentage: transactionData.serviceFeePercentage,
      serviceFee: transactionData.serviceFee,
      netAmount: transactionData.netAmount,
      status: transactionData.status as TransactionStatus,
      txHash: transactionData.txHash,
      fromAddress: transactionData.fromAddress,
      bankAccountName: transactionData.bankAccountName,
      bankAccountNumber: transactionData.bankAccountNumber,
      bankRoutingNumber: transactionData.bankRoutingNumber,
      bankWireReference: transactionData.bankWireReference,
      complianceCheckId: transactionData.complianceCheckId,
      complianceStatus: transactionData.complianceStatus,
      notes: transactionData.notes,
      createdAt: transactionData.createdAt,
      updatedAt: transactionData.updatedAt,
    });
  }

  /**
   * Deletes a transaction by ID
   */
  public async delete(id: string): Promise<void> {
    await this.prisma.transaction.delete({
      where: { id },
    });
  }
}

