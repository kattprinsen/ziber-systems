import type { CurrencyFormatOptions, PercentageFormatOptions } from '../types/salary';

/**
 * Format number as currency
 */
export function formatCurrency(
  amount: number,
  options?: CurrencyFormatOptions
): string {
  const formatter = new Intl.NumberFormat(options?.locale || 'sv-SE', {
    style: 'currency',
    currency: options?.currency || 'SEK',
    minimumFractionDigits: options?.minimumFractionDigits ?? 0,
    maximumFractionDigits: options?.maximumFractionDigits ?? 0,
  });
  
  return formatter.format(amount);
}

/**
 * Format percentage with sign
 */
export function formatPercentage(
  value: number,
  options?: PercentageFormatOptions
): string {
  const decimals = options?.decimals ?? 2;
  const showSign = options?.showSign !== false;
  const showSymbol = options?.showSymbol !== false;
  
  const sign = showSign && value > 0 ? '+' : '';
  const symbol = showSymbol ? '%' : '';
  
  return `${sign}${value.toFixed(decimals)}${symbol}`;
}

/**
 * Parse currency string to number
 */
export function parseCurrency(currencyString: string): number {
  // Remove currency symbols (kr, SEK), spaces, and common separators
  const cleaned = currencyString.replace(/[kr$SEK,\s]/gi, '').replace(/\u00A0/g, '');
  const value = parseFloat(cleaned);
  
  if (isNaN(value)) {
    throw new Error(`Cannot parse currency string: ${currencyString}`);
  }
  
  return value;
}
