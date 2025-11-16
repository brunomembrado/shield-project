/**
 * Exchange Rate Service Interface
 * 
 * Defines the contract for fetching exchange rates
 * 
 * @module transaction-service/domain/services
 */

/**
 * Exchange rate service interface
 */
export interface IExchangeRateService {
  /**
   * Gets current USDT to USD exchange rate
   */
  getUSDTToUSDRate(): Promise<string>;
}

