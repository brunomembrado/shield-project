/**
 * Blockchain Client Factory
 * 
 * Creates appropriate blockchain client based on chain type
 * 
 * @module blockchain-service/data/clients
 */

import { ChainType, ServiceError } from '@shield/shared/types';
import { IBlockchainClient } from '../../domain/services/IBlockchainClient';
import { PolygonClient } from '../../polygonClient';
import { TronClient } from '../../tronClient';
import { isNotNull } from '@shield/shared/utils/guards';

/**
 * Blockchain Client Factory
 */
export class BlockchainClientFactory {
  /**
   * Creates a blockchain client for the given chain
   */
  public static create(chain: ChainType): IBlockchainClient {
    if (chain === ChainType.POLYGON) {
      return new PolygonClient({
        rpcUrl: this.getRequiredEnv('POLYGON_RPC_URL'),
        chainId: parseInt(this.getRequiredEnv('POLYGON_CHAIN_ID'), 10),
        usdtContract: this.getRequiredEnv('POLYGON_USDT_CONTRACT'),
      });
    }

    if (chain === ChainType.TRON) {
      return new TronClient({
        rpcUrl: this.getRequiredEnv('TRON_RPC_URL'),
        chainId: parseInt(this.getRequiredEnv('TRON_CHAIN_ID'), 10),
        usdtContract: this.getRequiredEnv('TRON_USDT_CONTRACT'),
      });
    }

    throw new ServiceError(`Unsupported chain: ${chain}`, 400);
  }

  /**
   * Gets required environment variable or throws
   */
  private static getRequiredEnv(key: string): string {
    const value = process.env[key];
    if (!isNotNull(value)) {
      throw new ServiceError(`${key} is not configured`, 500);
    }
    return value;
  }
}

