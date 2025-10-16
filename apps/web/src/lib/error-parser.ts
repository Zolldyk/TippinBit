import { BaseError } from 'viem';

/**
 * Result from parsing a contract error.
 *
 * @property userMessage - User-friendly error message to display
 * @property code - Error code for logging/debugging
 * @property isUserRejection - True if the user intentionally rejected the transaction
 */
export interface TransactionErrorResult {
  userMessage: string;
  code: string;
  isUserRejection: boolean;
}

/**
 * Parses Viem/Wagmi contract errors into user-friendly messages.
 * Handles common error types like user rejection, insufficient funds, gas estimation failures, etc.
 *
 * @param error - The error thrown by Wagmi/Viem hooks
 * @returns Transaction error result with user-friendly message and metadata
 *
 * @example
 * try {
 *   await writeContract(request);
 * } catch (error) {
 *   const { userMessage, code, isUserRejection } = parseContractError(error);
 *   if (!isUserRejection) {
 *     console.error(`[${code}] ${userMessage}`);
 *   }
 * }
 */
export function parseContractError(error: unknown): TransactionErrorResult {
  // Handle Viem BaseError instances
  if (error instanceof BaseError) {
    // Check for specific error patterns

    // User rejected the transaction in their wallet
    if (error.name === 'UserRejectedRequestError') {
      return {
        userMessage: '',
        code: 'USER_REJECTED',
        isUserRejection: true,
      };
    }

    // Insufficient funds for transaction
    if (
      error.name === 'InsufficientFundsError' ||
      error.message.toLowerCase().includes('insufficient funds')
    ) {
      return {
        userMessage: "You don't have enough MUSD for this transaction",
        code: 'INSUFFICIENT_FUNDS',
        isUserRejection: false,
      };
    }

    // Transaction execution error (contract revert)
    if (
      error.name === 'TransactionExecutionError' ||
      error.name === 'ContractFunctionExecutionError'
    ) {
      return {
        userMessage: 'Transaction failed on the blockchain. Your funds are safe.',
        code: 'TX_FAILED',
        isUserRejection: false,
      };
    }

    // Gas estimation failure
    if (
      error.name === 'EstimateGasExecutionError' ||
      error.message.toLowerCase().includes('gas estimation')
    ) {
      return {
        userMessage: 'Unable to estimate gas. Transaction may fail.',
        code: 'GAS_ESTIMATION_FAILED',
        isUserRejection: false,
      };
    }

    // Timeout error
    if (error.name === 'TimeoutError' || error.message.toLowerCase().includes('timeout')) {
      return {
        userMessage: 'Transaction confirmation timed out. Check explorer.',
        code: 'TIMEOUT',
        isUserRejection: false,
      };
    }
  }

  // Fallback for unknown errors
  return {
    userMessage: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN',
    isUserRejection: false,
  };
}

/**
 * Validates a transaction hash format.
 * A valid transaction hash is 0x followed by 64 hexadecimal characters.
 *
 * @param hash - The transaction hash to validate
 * @returns True if valid, false otherwise
 *
 * @example
 * validateTxHash('0x123...abc'); // false (too short)
 * validateTxHash('0x' + 'a'.repeat(64)); // true
 * validateTxHash('123abc'); // false (missing 0x prefix)
 */
export function validateTxHash(hash: string): boolean {
  // Must start with 0x
  if (!hash.startsWith('0x')) {
    return false;
  }

  // Must be exactly 66 characters (0x + 64 hex chars)
  if (hash.length !== 66) {
    return false;
  }

  // Must contain only hexadecimal characters after 0x
  const hexPattern = /^0x[0-9a-fA-F]{64}$/;
  return hexPattern.test(hash);
}
