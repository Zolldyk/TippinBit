import { isAddress, getAddress } from 'viem';
import type { Address } from 'viem';

/**
 * Validates a payment address and returns a checksummed Ethereum address.
 *
 * @param addr - The address string to validate
 * @returns The checksummed address if valid, or null if invalid
 *
 * @example
 * ```typescript
 * const valid = validatePaymentAddress('0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A');
 * // Returns: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A' (checksummed)
 *
 * const invalid = validatePaymentAddress('invalid-address');
 * // Returns: null
 * ```
 */
export function validatePaymentAddress(addr: string): Address | null {
  if (!isAddress(addr)) {
    return null;
  }
  return getAddress(addr);
}

/**
 * Parses and validates an amount string for payment processing.
 *
 * @param amountStr - The amount string to parse (e.g., "5", "10.50")
 * @returns The parsed number if valid and positive, or undefined if invalid
 *
 * @example
 * ```typescript
 * parsePaymentAmount('5');        // Returns: 5
 * parsePaymentAmount('10.50');    // Returns: 10.5
 * parsePaymentAmount('');         // Returns: undefined
 * parsePaymentAmount('abc');      // Returns: undefined
 * parsePaymentAmount('-5');       // Returns: undefined
 * parsePaymentAmount('0');        // Returns: undefined
 * ```
 */
export function parsePaymentAmount(amountStr?: string): number | undefined {
  if (!amountStr || amountStr.trim() === '') {
    return undefined;
  }

  const parsed = parseFloat(amountStr);

  if (isNaN(parsed) || !Number.isFinite(parsed) || parsed <= 0) {
    return undefined;
  }

  return parsed;
}
