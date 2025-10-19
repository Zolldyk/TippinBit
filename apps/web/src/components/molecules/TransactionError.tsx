'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '@/components/atoms/Button';
import { parseContractError } from '@/lib/error-parser';
import { BorrowingErrorType, type BorrowingError } from '@/types/domain';

interface TransactionErrorProps {
  error: Error | BorrowingError;
  step: 1 | 2 | 3;
  onRetry: () => void;
  onCancel: () => void;
}

/**
 * Get user-friendly error message based on error type
 */
function getErrorMessage(error: Error | BorrowingError, step: number): string {
  // Check if it's a BorrowingError with type
  if ('type' in error && error.type) {
    switch (error.type) {
      case BorrowingErrorType.USER_REJECTED:
        return 'You cancelled the transaction. Click retry to try again.';
      case BorrowingErrorType.INSUFFICIENT_GAS:
        return 'Transaction failed due to insufficient gas. Please add ETH to your wallet and retry.';
      case BorrowingErrorType.INSUFFICIENT_BALANCE:
        return 'Insufficient BTC balance. Please reduce the tip amount or add more BTC.';
      case BorrowingErrorType.NETWORK_ERROR:
        return 'Network error. Check your connection and retry.';
      case BorrowingErrorType.CONTRACT_ERROR:
        return `Step ${step} failed: ${parseContractError(error)}`;
      default:
        return 'An unexpected error occurred. Please try again.';
    }
  }

  // Fallback: Try to parse as contract error
  const parsed = parseContractError(error);
  if (parsed !== error.message) {
    return `Step ${step} failed: ${parsed}`;
  }

  // Generic error
  return `Step ${step} failed: ${error.message || 'An unexpected error occurred. Please try again.'}`;
}

/**
 * Get step name for error context
 */
function getStepName(step: number): string {
  switch (step) {
    case 1:
      return 'Approve collateral';
    case 2:
      return 'Mint MUSD';
    case 3:
      return 'Send to creator';
    default:
      return `Step ${step}`;
  }
}

/**
 * TransactionError component
 *
 * Displays user-friendly error messages for failed borrowing transactions.
 * Parses contract errors and provides context-aware messages with retry/cancel actions.
 */
export function TransactionError({
  error,
  step,
  onRetry,
  onCancel,
}: TransactionErrorProps) {
  const errorMessage = getErrorMessage(error, step);
  const stepName = getStepName(step);

  // Log error for debugging
  console.error(`[BorrowingFlow] ${stepName} failed:`, error);

  return (
    <div
      className="bg-red-50 border border-red-200 rounded-lg p-4"
      role="alert"
      aria-live="assertive"
    >
      <div className="flex items-start gap-3">
        <AlertCircle className="text-red-600 flex-shrink-0 mt-0.5" size={20} />
        <div className="flex-1">
          <h3 className="text-sm font-semibold text-red-900 mb-1">
            {stepName} Failed
          </h3>
          <p className="text-sm text-red-700 mb-4">{errorMessage}</p>

          <div className="flex gap-2">
            <Button
              onClick={onRetry}
              className="bg-coral-500 hover:bg-coral-600 text-white text-sm px-4 py-2"
            >
              Retry
            </Button>
            <Button
              onClick={onCancel}
              variant="secondary"
              className="text-sm px-4 py-2"
            >
              Cancel
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
