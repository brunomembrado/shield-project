/**
 * Create Transaction Use Case
 * 
 * Business logic for creating a new transaction
 * 
 * @module transaction-service/domain/useCases
 */

import { Transaction } from '../entities/Transaction';
import { ITransactionRepository } from '../repositories/ITransactionRepository';
import { IExchangeRateService } from '../services/IExchangeRateService';
import { IWalletService } from '../services/IWalletService';
import { ChainType } from '../../../../shared/types';
import {
  ServiceError,
  handleUnknownError,
  ValidationError,
  ExternalServiceError,
} from '../../../../shared/errors';
import { calculateServiceFee, calculateNetAmount } from '../../../../shared/utils';
import { isNotNull, isNonEmptyString } from '../../../../shared/utils/guards';
import { v4 as uuidv4 } from 'uuid';

/**
 * Create transaction use case input
 */
export interface CreateTransactionInput {
  userId: string;
  walletId: string;
  chain: ChainType;
  amountUSDT: string;
  bankAccountName: string;
  bankAccountNumber: string;
  bankRoutingNumber?: string;
}

/**
 * Create Transaction Use Case
 */
export class CreateTransactionUseCase {
  constructor(
    private readonly transactionRepository: ITransactionRepository,
    private readonly exchangeRateService: IExchangeRateService,
    private readonly walletService: IWalletService
  ) {}

  /**
   * Executes the create transaction use case
   */
  public async execute(
    input: CreateTransactionInput,
    correlationId: string = ''
  ): Promise<Transaction> {
    try {
      // Validate input (business logic)
      if (!isNonEmptyString(input.amountUSDT)) {
        throw new ValidationError('Amount USDT is required', {
          field: 'amountUSDT',
        });
      }

      if (!isNonEmptyString(input.bankAccountName)) {
        throw new ValidationError('Bank account name is required', {
          field: 'bankAccountName',
        });
      }

      if (!isNonEmptyString(input.bankAccountNumber)) {
        throw new ValidationError('Bank account number is required', {
          field: 'bankAccountNumber',
        });
      }

      // Get Shield wallet address (business logic - determines where payment should go)
      const toAddress = await this.walletService.getWalletAddress(
        input.walletId,
        input.chain
      );

      // Get exchange rate (business logic)
      const exchangeRate = await this.exchangeRateService.getUSDTToUSDRate();

      // Calculate USD amount (business logic)
      const amountUSD = (parseFloat(input.amountUSDT) * parseFloat(exchangeRate)).toFixed(2);

      // Calculate service fee (business logic)
      const serviceFeePercentage = process.env.SERVICE_FEE_PERCENTAGE || '1';
      const serviceFee = calculateServiceFee(amountUSD, parseFloat(serviceFeePercentage));

      // Calculate net amount (business logic)
      const netAmount = calculateNetAmount(amountUSD, serviceFee);

      // Create transaction entity (business logic)
      const transaction = Transaction.create(
        uuidv4(),
        input.userId,
        input.walletId,
        input.chain,
        toAddress,
        input.amountUSDT,
        amountUSD,
        exchangeRate,
        serviceFeePercentage,
        serviceFee,
        netAmount,
        input.bankAccountName,
        input.bankAccountNumber,
        input.bankRoutingNumber || null
      );

      // Save transaction (delegate to repository)
      const savedTransaction = await this.transactionRepository.save(transaction);

      return savedTransaction;
    } catch (error: unknown) {
      // Re-throw known errors
      if (
        error instanceof ServiceError ||
        error instanceof ValidationError ||
        error instanceof ExternalServiceError
      ) {
        throw error;
      }

      // Wrap unknown errors
      throw handleUnknownError(error, 'Failed to create transaction', {
        userId: input.userId,
        walletId: input.walletId,
        chain: input.chain,
        operation: 'createTransaction',
        correlationId,
      });
    }
  }
}
