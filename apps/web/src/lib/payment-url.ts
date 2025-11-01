import type { Address, PaymentUrlParams } from '@/types/domain';

/**
 * Build payment URL for QR code and link sharing
 *
 * Constructs full payment URLs with proper query parameters for:
 * - Username-based payments (@alice)
 * - Address-based payments (0x123...)
 * - Optional amount parameter
 * - Optional thank-you message parameter
 *
 * Examples:
 * - Username: https://tippinbit.com/pay/@alice
 * - Username + amount: https://tippinbit.com/pay/@alice?amount=5
 * - Username + message: https://tippinbit.com/pay/@alice?message=Thank%20you!
 * - Address: https://tippinbit.com/pay?to=0x123...
 * - Address + amount + message: https://tippinbit.com/pay?to=0x123...&amount=5&message=Thank%20you!
 *
 * @param params - Payment URL parameters
 * @returns Full payment URL string
 * @throws Error if neither username nor address is provided
 */
export function buildPaymentUrl(params: PaymentUrlParams): string {
  // Use window.location.origin when in browser (ensures correct domain)
  // Fall back to env variable for SSR/build time
  const baseUrl =
    typeof window !== 'undefined'
      ? window.location.origin
      : (process.env['NEXT_PUBLIC_BASE_URL'] || 'https://tippinbit.netlify.app');

  if (params.username) {
    // Username-based URL (AC3)
    // Ensure @ prefix
    const username = params.username.startsWith('@')
      ? params.username
      : `@${params.username}`;

    const path = `/pay/${username}`;
    const url = new URL(path, baseUrl);

    if (params.amount) {
      url.searchParams.set('amount', params.amount); // AC11
    }

    if (params.message) {
      const trimmedMessage = params.message.trim();
      if (trimmedMessage) {
        url.searchParams.set('message', trimmedMessage); // AC5, AC6 - URL.searchParams.set handles encoding
      }
    }

    return url.toString();
  }

  if (params.address) {
    // Address-based URL (AC3)
    const path = '/pay';
    const url = new URL(path, baseUrl);
    url.searchParams.set('to', params.address);

    if (params.amount) {
      url.searchParams.set('amount', params.amount); // AC11
    }

    if (params.message) {
      const trimmedMessage = params.message.trim();
      if (trimmedMessage) {
        url.searchParams.set('message', trimmedMessage); // AC5, AC6 - URL.searchParams.set handles encoding
      }
    }

    return url.toString();
  }

  throw new Error('Either username or address must be provided');
}

/**
 * Extract username from payment URL
 *
 * @param url - Payment URL string
 * @returns Username with @ prefix, or null if not found
 */
export function extractUsernameFromUrl(url: string): string | null {
  try {
    const urlObj = new URL(url);
    const match = urlObj.pathname.match(/^\/pay\/@([a-zA-Z0-9_]+)$/);
    return match ? `@${match[1]}` : null;
  } catch {
    return null;
  }
}

/**
 * Generate QR code filename from username or address
 *
 * Format: tippinbit-{username|address}-qr
 *
 * @param username - Username with @ prefix
 * @param address - Wallet address
 * @returns Filename without extension
 */
export function generateQRFilename(
  username?: string,
  address?: Address
): string {
  if (username) {
    const cleanUsername = username.replace('@', '');
    return `tippinbit-${cleanUsername}-qr`;
  }

  if (address) {
    // Use first 8 characters of address for filename
    const shortAddress = address.slice(0, 10);
    return `tippinbit-${shortAddress}-qr`;
  }

  return 'tippinbit-qr';
}
