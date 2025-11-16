/**
 * Exchange Rate Service Implementation
 * 
 * Fetches USDT to USD exchange rates from external API
 * 
 * @module transaction-service/data/services
 */

import axios from 'axios';
import { IExchangeRateService } from '../../domain/services/IExchangeRateService';
import { transactionServiceLogger } from '../../../../shared/logger/serviceLogger';
import { withExternalApiLogging } from '../../../../shared/logger/helpers';

/**
 * Exchange Rate Service Implementation using CoinGecko API
 */
export class ExchangeRateService implements IExchangeRateService {
  private readonly apiUrl = 'https://api.coingecko.com/api/v3/simple/price';
  private readonly timeout = 5000;

  /**
   * Gets current USDT to USD exchange rate
   */
  public async getUSDTToUSDRate(): Promise<string> {
    const logger = transactionServiceLogger();
    const correlationId = 'exchange-rate-fetch';

    try {
      const response = await withExternalApiLogging(
        logger,
        'CoinGeckoAPI',
        '/simple/price',
        correlationId,
        async () => {
          return await axios.get(
            `${this.apiUrl}?ids=tether&vs_currencies=usd`,
            { timeout: this.timeout }
          );
        }
      );

      const rate = response.data?.tether?.usd;
      if (isNotNull(rate) && typeof rate === 'number') {
        return rate.toString();
      }

      // Fallback to 1.0 if API response is invalid
      logger.warn('Invalid exchange rate response, using fallback', {
        correlationId,
        response: response.data,
      });
      return '1.0';
    } catch (error) {
      logger.error('Failed to fetch exchange rate, using fallback', error as Error, {
        correlationId,
      });
      // Fallback to 1.0 if API fails (USDT is pegged to USD)
      return '1.0';
    }
  }
}

// Import isNotNull
import { isNotNull } from '../../../../shared/utils/guards';

