/**
 * Get Token Balance Use Case - Domain Layer
 * 
 * Gets wallet token balance (DIRECT RPC CALL - NO CACHE)
 * 
 * @module blockchain-service/domain/useCases
 */

import { ChainType } from '@shield/shared/types';
import { IBlockchainClient } from '../services/IBlockchainClient';
import { ValidationError } from '@shield/shared/errors';

export interface GetTokenBalanceResult {
  chain: ChainType;
  address: string;
  tokenAddress: string;
  balance: string;
  balanceFormatted: string;
  tokenSymbol: string;
  tokenDecimals: number;
}

/**
 * Gets wallet token balance - every call goes directly to blockchain RPC
 */
export class GetTokenBalanceUseCase {
  constructor(private readonly blockchainClient: IBlockchainClient) {}

  public async execute(
    chain: ChainType,
    address: string,
    tokenAddress: string,
    correlationId: string = ''
  ): Promise<GetTokenBalanceResult> {
    // Validate address format
    if (!this.isValidAddress(chain, address)) {
      throw new ValidationError(`Invalid ${chain} address format: ${address}`, {
        chain,
        address,
        correlationId,
      });
    }

    // ✅ DIRECT BLOCKCHAIN CALL - NO CACHE
    const balanceData = await this.blockchainClient.getTokenBalance(
      chain,
      address,
      tokenAddress
    );

    return {
      chain,
      address,
      tokenAddress,
      balance: balanceData.balance,
      balanceFormatted: balanceData.formatted,
      tokenSymbol: balanceData.symbol,
      tokenDecimals: balanceData.decimals,
    };
  }

  private isValidAddress(chain: ChainType, address: string): boolean {
    if (chain === ChainType.POLYGON) {
      return /^0x[0-9a-fA-F]{40}$/.test(address);
    } else if (chain === ChainType.TRON) {
      return /^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(address);
    }
    return false;
  }
}

