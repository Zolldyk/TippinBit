import type { Address } from 'viem';
import type { TransactionErrorResult } from '../error-parser';

/**
 * Context information for error logging.
 * Includes transaction details and user context for debugging.
 */
export interface ErrorContext {
  userAddress?: Address;
  txHash?: string;
  errorCode: string;
  retryCount: number;
  timestamp: number;
  chainId?: number;
  contractAddress?: Address;
  functionName?: string;
}

/**
 * Logs transaction errors with contextual information.
 * In development: Logs detailed error information to console.
 * In production: Placeholder for Sentry integration.
 *
 * Features:
 * - Skips logging for user rejections (intentional actions)
 * - Sanitizes sensitive data (no private keys, full addresses in logs)
 * - Environment-specific logging (detailed in dev, minimal in prod)
 * - Structured logging format for easy parsing
 *
 * @param error - The original error object
 * @param errorResult - Parsed error result with user-friendly message
 * @param context - Additional context about the transaction
 *
 * @example
 * try {
 *   await writeContract(request);
 * } catch (error) {
 *   const errorResult = parseContractError(error);
 *   logError(error, errorResult, {
 *     userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *     txHash: '0x123...',
 *     errorCode: 'TX_FAILED',
 *     retryCount: 0,
 *     timestamp: Date.now(),
 *   });
 * }
 */
export function logError(
  error: Error,
  errorResult: TransactionErrorResult,
  context: ErrorContext
): void {
  // Don't log user rejections (intentional actions, not errors)
  if (errorResult.isUserRejection) {
    return;
  }

  // Sanitize user address for privacy (show first 6 and last 4 chars)
  const sanitizedAddress = context.userAddress
    ? `${context.userAddress.slice(0, 6)}...${context.userAddress.slice(-4)}`
    : undefined;

  // Structured log object
  const logData = {
    code: errorResult.code,
    severity: errorResult.severity || 'error',
    message: errorResult.userMessage,
    originalError: error.message,
    context: {
      ...context,
      userAddress: sanitizedAddress, // Use sanitized address
    },
  };

  // Development: Detailed console logging
  if (process.env.NODE_ENV === 'development') {
    console.error('Transaction Error:', logData);

    // Log stack trace for debugging
    if (error.stack) {
      console.error('Stack trace:', error.stack);
    }
  }

  // Production: Sentry integration (placeholder)
  // TODO: Enable Sentry in production
  // if (process.env.NODE_ENV === 'production') {
  //   Sentry.captureException(error, {
  //     contexts: {
  //       transaction: context,
  //     },
  //     tags: {
  //       errorCode: errorResult.code,
  //       severity: errorResult.severity,
  //     },
  //     level: errorResult.severity === 'error' ? 'error' : 'warning',
  //   });
  // }
}

/**
 * Logs transaction success events.
 * Useful for monitoring transaction performance and success rates.
 *
 * @param txHash - Transaction hash
 * @param context - Transaction context
 *
 * @example
 * logTransactionSuccess('0x123...', {
 *   userAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   amount: '5.00',
 *   duration: 15000, // 15 seconds
 * });
 */
export function logTransactionSuccess(
  txHash: string,
  context: Record<string, unknown>
): void {
  if (process.env.NODE_ENV === 'development') {
    console.log('Transaction Success:', {
      txHash,
      ...context,
      timestamp: new Date().toISOString(),
    });
  }

  // Production: Track success metrics in analytics
  // if (process.env.NODE_ENV === 'production') {
  //   // Analytics integration (e.g., Mixpanel, Amplitude)
  //   // trackEvent('transaction_success', { txHash, ...context });
  // }
}
