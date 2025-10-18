import { BaseError } from 'viem';

/**
 * Result from parsing a contract error.
 *
 * @property userMessage - User-friendly error message to display
 * @property code - Error code for logging/debugging
 * @property isUserRejection - True if the user intentionally rejected the transaction
 * @property severity - Severity level for UI styling (info, warning, error)
 * @property actionable - Suggested user action (e.g., "Get MUSD from faucet")
 */
export interface TransactionErrorResult {
  userMessage: string;
  code: string;
  isUserRejection: boolean;
  severity?: 'info' | 'warning' | 'error';
  actionable?: string;
}

/**
 * Parses Viem/Wagmi contract errors into user-friendly messages.
 * Handles common error types like user rejection, insufficient funds, gas estimation failures, etc.
 *
 * @param error - The error thrown by Wagmi/Viem hooks
 * @returns Transaction error result with user-friendly message and metadata
 *
 * @example User rejection (silent handling)
 * try {
 *   await writeContract(request);
 * } catch (error) {
 *   const result = parseContractError(error);
 *   if (!result.isUserRejection) {
 *     console.error(`[${result.code}] ${result.userMessage}`);
 *   }
 * }
 *
 * @example Insufficient funds with actionable message
 * try {
 *   await writeContract(request);
 * } catch (error) {
 *   const result = parseContractError(error);
 *   // result.severity === 'warning'
 *   // result.actionable === 'Get MUSD from testnet faucet'
 *   showError(result);
 * }
 *
 * @example Out of gas error with specific guidance
 * try {
 *   await writeContract(request);
 * } catch (error) {
 *   const result = parseContractError(error);
 *   // result.severity === 'warning'
 *   // result.actionable === 'Try again with higher gas or reduce tip amount'
 *   showError(result);
 * }
 *
 * @example Network/RPC connection failure
 * try {
 *   await writeContract(request);
 * } catch (error) {
 *   const result = parseContractError(error);
 *   // result.severity === 'warning'
 *   // result.actionable === 'Check your internet connection and retry'
 *   showError(result);
 * }
 */
export function parseContractError(error: unknown): TransactionErrorResult {
  // Handle Viem BaseError instances
  if (error instanceof BaseError) {
    const errorMessage = error.message.toLowerCase();

    // User rejected the transaction in their wallet
    if (error.name === 'UserRejectedRequestError') {
      return {
        userMessage: '',
        code: 'USER_REJECTED',
        isUserRejection: true,
        severity: 'info',
      };
    }

    // Out of gas error (specific detection for AC6)
    if (
      errorMessage.includes('out of gas') ||
      errorMessage.includes('gas required exceeds allowance') ||
      errorMessage.includes('intrinsic gas too low')
    ) {
      return {
        userMessage:
          'Transaction failed due to network fee. Try again with higher gas or reduce tip amount.',
        code: 'OUT_OF_GAS',
        isUserRejection: false,
        severity: 'warning',
        actionable: 'Try again with higher gas or reduce tip amount',
      };
    }

    // Insufficient funds for transaction
    if (
      error.name === 'InsufficientFundsError' ||
      errorMessage.includes('insufficient funds')
    ) {
      return {
        userMessage: "You don't have enough MUSD for this transaction",
        code: 'INSUFFICIENT_FUNDS',
        isUserRejection: false,
        severity: 'warning',
        actionable: 'Get MUSD from testnet faucet',
      };
    }

    // Gas estimation failure
    if (
      error.name === 'EstimateGasExecutionError' ||
      errorMessage.includes('gas estimation')
    ) {
      return {
        userMessage: 'Unable to estimate gas. Transaction may fail.',
        code: 'GAS_ESTIMATION_FAILED',
        isUserRejection: false,
        severity: 'warning',
        actionable: 'Check your balance and try again',
      };
    }

    // RPC connection failures (NEW)
    if (
      error.name === 'HttpRequestError' ||
      error.name === 'RpcRequestError' ||
      errorMessage.includes('fetch failed') ||
      errorMessage.includes('network error') ||
      errorMessage.includes('failed to fetch')
    ) {
      return {
        userMessage: 'Unable to connect to the network. Please check your connection.',
        code: 'RPC_CONNECTION_FAILED',
        isUserRejection: false,
        severity: 'warning',
        actionable: 'Check your internet connection and retry',
      };
    }

    // Timeout error
    if (error.name === 'TimeoutError' || errorMessage.includes('timeout')) {
      return {
        userMessage: 'Connection lost. Your funds are safe. Retry now?',
        code: 'TIMEOUT',
        isUserRejection: false,
        severity: 'warning',
        actionable: 'Retry transaction',
      };
    }

    // Contract revert with custom error extraction (enhanced)
    if (
      error.name === 'TransactionExecutionError' ||
      error.name === 'ContractFunctionExecutionError' ||
      error.name === 'ContractFunctionRevertedError'
    ) {
      // Try to extract revert reason
      let revertReason = 'Transaction failed on the blockchain';

      // Check for revert reason in error message
      const revertMatch = errorMessage.match(/revert\s+(.+?)(?:\n|$)/i);
      if (revertMatch && revertMatch[1]) {
        revertReason = revertMatch[1].trim();
      }

      return {
        userMessage: `${revertReason}. Your funds are safe.`,
        code: 'CONTRACT_REVERT',
        isUserRejection: false,
        severity: 'error',
        actionable: 'View transaction details',
      };
    }
  }

  // Fallback for unknown errors
  return {
    userMessage: 'An unexpected error occurred. Please try again.',
    code: 'UNKNOWN',
    isUserRejection: false,
    severity: 'error',
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
