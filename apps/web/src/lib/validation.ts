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

/**
 * Validates a username according to TippinBit rules.
 *
 * Rules:
 * - Length: 3-20 characters
 * - Characters: alphanumeric + underscore + hyphen only
 * - Regex: /^[a-zA-Z0-9_-]+$/
 *
 * @param username - The username string to validate (with or without @ prefix)
 * @returns Error message string if invalid, or null if valid
 *
 * @example
 * ```typescript
 * validateUsername('alice');        // Returns: null (valid)
 * validateUsername('@alice');       // Returns: null (valid)
 * validateUsername('ab');           // Returns: 'Username must be at least 3 characters'
 * validateUsername('alice@bob');    // Returns: 'Username can only contain letters...'
 * ```
 */
export function validateUsername(username: string): string | null {
  // Remove @ prefix if present
  const cleanUsername = username.replace(/^@/, '');

  if (cleanUsername.length < 3) {
    return 'Username must be at least 3 characters';
  }

  if (cleanUsername.length > 20) {
    return 'Username must be at most 20 characters';
  }

  if (!/^[a-zA-Z0-9_-]+$/.test(cleanUsername)) {
    return 'Username can only contain letters, numbers, underscores, and hyphens';
  }

  return null; // Valid
}

/**
 * Normalizes a username to standard format.
 *
 * - Always prepends @ if missing
 * - Converts to lowercase
 *
 * @param username - The username string to normalize
 * @returns Normalized username with @ prefix in lowercase
 *
 * @example
 * ```typescript
 * normalizeUsername('alice');     // Returns: '@alice'
 * normalizeUsername('@Alice');    // Returns: '@alice'
 * normalizeUsername('ALICE');     // Returns: '@alice'
 * ```
 */
export function normalizeUsername(username: string): string {
  // Always prepend @ if missing
  const withAt = username.startsWith('@') ? username : `@${username}`;
  return withAt.toLowerCase();
}

/**
 * Generates username suggestions for taken usernames.
 *
 * Creates 3 alternative suggestions:
 * 1. Append number: @alice → @alice2
 * 2. Append "_creator": @alice → @alice_creator
 * 3. Append descriptor: @alice → @alicewrites
 *
 * @param baseUsername - The taken username (with or without @ prefix)
 * @returns Array of 3 suggested alternative usernames
 *
 * @example
 * ```typescript
 * generateUsernameSuggestions('alice');
 * // Returns: ['@alice2', '@alice_creator', '@alicewrites']
 *
 * generateUsernameSuggestions('@alice');
 * // Returns: ['@alice2', '@alice_creator', '@alicewrites']
 * ```
 */
export function generateUsernameSuggestions(baseUsername: string): string[] {
  const clean = baseUsername.replace(/^@/, '');

  return [`@${clean}2`, `@${clean}_creator`, `@${clean}writes`];
}
