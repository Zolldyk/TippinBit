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
