/**
 * Estimate Gas Use Case - Domain Layer
 * 
 * Estimates gas/energy cost for transactions (DIRECT RPC CALL - NO CACHE)
 * 
 * @module blockchain-service/domain/useCases
 */

import { ChainType } from '@shield/shared/types';
import { IBlockchainClient } from '../services/IBlockchainClient';

export interface EstimateGasResult {
  chain: ChainType;
  transactionType: string;
  estimatedGas: string;
  gasPrice: string;
  estimatedCost: string;
  estimatedCostUSD?: string;
}

/**
 * Estimates transaction gas/energy costs - every call goes directly to blockchain RPC
 */
export class EstimateGasUseCase {
  constructor(private readonly blockchainClient: IBlockchainClient) {}

  public async execute(
    chain: ChainType,
    transactionType: string,
    correlationId: string = ''
  ): Promise<EstimateGasResult> {
    // ✅ DIRECT BLOCKCHAIN CALL - NO CACHE
    const gasData = await this.blockchainClient.estimateGas(chain, transactionType);

    return {
      chain,
      transactionType,
      estimatedGas: gasData.gasLimit,
      gasPrice: gasData.gasPrice,
      estimatedCost: gasData.totalCost,
      estimatedCostUSD: gasData.totalCostUSD,
    };
  }
}

