/**
 * Currency conversion utility functions
 */

// Exchange rate (USD to KES) - this would ideally come from an API
const USD_TO_KES_RATE = 128.5;

/**
 * Convert USD to KES
 * 
 * @param usdAmount - Amount in USD
 * @returns Amount in KES
 */
export function usdToKes(usdAmount: number): number {
  return usdAmount * USD_TO_KES_RATE;
}

/**
 * Format an amount in KES with the appropriate currency symbol
 * 
 * @param kesAmount - Amount in KES
 * @returns Formatted string with KES symbol
 */
export function formatKes(kesAmount: number): string {
  return `KES ${kesAmount.toFixed(2)}`;
}

/**
 * Convert and format USD to KES
 * 
 * @param usdAmount - Amount in USD
 * @returns Formatted string with KES symbol
 */
export function convertAndFormatKes(usdAmount: number): string {
  const kesAmount = usdToKes(usdAmount);
  return formatKes(kesAmount);
}
