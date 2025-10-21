/**
 * Currency and amount formatting utilities
 */

/**
 * Formats a numeric value as USD currency with 2 decimal places.
 *
 * @param amount - The amount to format (string or number)
 * @returns Formatted currency string with dollar sign (e.g., "$5.00")
 *
 * @example
 * formatCurrency("5") // "$5.00"
 * formatCurrency("5.4") // "$5.40"
 * formatCurrency("5.4278") // "$5.43" (rounds to 2 decimals)
 * formatCurrency(12.99) // "$12.99"
 */
export function formatCurrency(amount: string | number): string {
  const numericValue = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericValue)) {
    return '$0.00';
  }

  // Format with commas for thousands separator
  return `$${numericValue.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/**
 * Parses user input to extract valid numeric amount string.
 * Strips all non-numeric characters except digits and decimal point.
 * Allows only one decimal point.
 *
 * @param input - Raw user input string
 * @returns Cleaned numeric string, empty if invalid
 *
 * @example
 * parseAmountInput("123") // "123"
 * parseAmountInput("12.34") // "12.34"
 * parseAmountInput("12a.34b") // "12.34" (strips letters)
 * parseAmountInput("12..34") // "12.34" (second decimal ignored)
 * parseAmountInput(".") // "0."
 * parseAmountInput(".5") // "0.5"
 * parseAmountInput("abc") // "" (no valid digits)
 */
export function parseAmountInput(input: string): string {
  if (!input) {
    return '';
  }

  // Strip all non-numeric characters except decimal point
  let cleaned = input.replace(/[^\d.]/g, '');

  // Handle edge case: starts with decimal point
  if (cleaned.startsWith('.')) {
    cleaned = '0' + cleaned;
  }

  // Allow only one decimal point (keep first, remove subsequent ones)
  const parts = cleaned.split('.');
  if (parts.length > 2) {
    cleaned = parts[0] + '.' + parts.slice(1).join('');
  }

  return cleaned;
}

/**
 * Calculates the maximum sendable amount after subtracting gas estimate.
 * Returns 0 if the balance is insufficient to cover gas costs.
 *
 * @param balance - Available balance in wei (bigint)
 * @param gasEstimate - Estimated gas cost in wei (bigint)
 * @returns Maximum sendable amount in wei (bigint), or 0 if insufficient
 *
 * @example
 * calculateMaxSendable(BigInt(100), BigInt(10)) // BigInt(90)
 * calculateMaxSendable(BigInt(5), BigInt(10)) // BigInt(0) (insufficient)
 * calculateMaxSendable(BigInt(50), BigInt(50)) // BigInt(0) (exact match)
 */
export function calculateMaxSendable(
  balance: bigint,
  gasEstimate: bigint
): bigint {
  const maxSendable = balance - gasEstimate;
  return maxSendable > BigInt(0) ? maxSendable : BigInt(0);
}

/**
 * Formats a timestamp as a human-readable time ago string
 *
 * Converts a millisecond timestamp to a relative time string
 * (e.g., "2 minutes ago", "1 hour ago").
 *
 * @param timestamp - Unix timestamp in milliseconds
 * @returns Human-readable time ago string
 *
 * @example
 * formatTimeAgo(Date.now() - 120000) // "2 minutes ago"
 * formatTimeAgo(Date.now() - 900000) // "15 minutes ago"
 * formatTimeAgo(Date.now() - 3600000) // "1 hour ago"
 */
export function formatTimeAgo(timestamp: number): string {
  const minutes = Math.floor((Date.now() - timestamp) / 60000);
  if (minutes < 1) return 'just now';
  if (minutes === 1) return '1 minute ago';
  if (minutes < 60) return `${minutes} minutes ago`;
  const hours = Math.floor(minutes / 60);
  if (hours === 1) return '1 hour ago';
  return `${hours} hours ago`;
}

/**
 * Truncates an Ethereum address to a shorter display format
 *
 * Takes a full Ethereum address and returns a shortened version
 * showing the first 6 characters and last 4 characters.
 *
 * @param address - Full Ethereum address (0x... format)
 * @returns Truncated address string (e.g., "0x1234...5678")
 *
 * @example
 * truncateAddress("0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb")
 * // Returns: "0x742d...f0bEb"
 */
export function truncateAddress(address: string): string {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

/**
 * Encode message for URL parameter
 *
 * Handles special characters, emoji, and spaces safely using
 * URL encoding (percent encoding).
 *
 * @param message - The message text to encode
 * @returns URL-encoded message string, or empty string if invalid
 *
 * @example
 * encodeMessageForUrl("Thank you for the coffee! ☕")
 * // Returns: "Thank%20you%20for%20the%20coffee!%20%E2%98%95"
 *
 * encodeMessageForUrl("  ")
 * // Returns: ""
 */
export function encodeMessageForUrl(message: string): string {
  if (!message || message.trim().length === 0) {
    return '';
  }

  return encodeURIComponent(message.trim());
}

/**
 * Decode message from URL parameter
 *
 * Decodes a URL-encoded message string back to plain text.
 * Returns empty string if decoding fails.
 *
 * @param encodedMessage - The URL-encoded message string
 * @returns Decoded message string, or empty string if invalid
 *
 * @example
 * decodeMessageFromUrl("Thank%20you!")
 * // Returns: "Thank you!"
 *
 * decodeMessageFromUrl("invalid%2")
 * // Returns: "" (malformed encoding)
 */
export function decodeMessageFromUrl(encodedMessage: string): string {
  if (!encodedMessage) {
    return '';
  }

  try {
    return decodeURIComponent(encodedMessage);
  } catch (error) {
    console.error('Failed to decode message:', error);
    return '';
  }
}
