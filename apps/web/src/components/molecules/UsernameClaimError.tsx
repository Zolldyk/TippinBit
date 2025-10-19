'use client';

import { AlertCircle } from 'lucide-react';
import { Button } from '../atoms/Button';

/**
 * Error object from useUsernameClaim hook
 */
interface ClaimError {
  message: string;
  code?: string;
}

export interface UsernameClaimErrorProps {
  /**
   * The error object from the claim mutation
   */
  error: ClaimError;

  /**
   * Callback when user wants to try another username
   */
  onTryAnother: () => void;
}

/**
 * Username Claim Error Component
 *
 * Displays error state when username claim fails.
 *
 * Error types handled:
 * - USERNAME_TAKEN (409): Race condition - claimed between check and submission
 * - INVALID_SIGNATURE (401): Signature verification failed
 * - VALIDATION_ERROR (400): Invalid username format
 * - WALLET_NOT_CONNECTED: No wallet connected
 * - USER_REJECTED: User cancelled signature
 * - NETWORK_ERROR: Connection/server error
 * - Generic: Fallback for unknown errors
 *
 * @example
 * ```typescript
 * <UsernameClaimError
 *   error={{ message: 'Failed', code: 'USERNAME_TAKEN' }}
 *   onTryAnother={() => reset()}
 * />
 * ```
 */
export function UsernameClaimError({
  error,
  onTryAnother,
}: UsernameClaimErrorProps) {
  // Determine user-friendly error message based on error code
  const getErrorMessage = () => {
    switch (error.code) {
      case 'USERNAME_TAKEN':
        return 'Someone just claimed this username. Try another.';
      case 'INVALID_SIGNATURE':
        return 'Signature verification failed. Please try again.';
      case 'VALIDATION_ERROR':
        return 'Invalid username format. Please check and try again.';
      case 'WALLET_NOT_CONNECTED':
        return 'Please connect your wallet to claim a username.';
      case 'USER_REJECTED':
        return 'You cancelled the signature request. Click "Try Another" to claim again.';
      case 'NETWORK_ERROR':
        return 'Unable to connect to server. Please check your connection and try again.';
      default:
        return error.message || 'Something went wrong. Please try again.';
    }
  };

  // Determine if user should retry same username or try different one
  const shouldRetry = error.code === 'INVALID_SIGNATURE' || error.code === 'USER_REJECTED';
  const buttonText = shouldRetry ? 'Retry' : 'Try Another';

  return (
    <div
      className="bg-white border-2 border-red-200 rounded-lg p-6 space-y-4 animate-fadeIn"
      role="alert"
      aria-live="assertive"
    >
      {/* Error Icon and Message */}
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
          <AlertCircle className="w-6 h-6 text-red-600" aria-hidden="true" />
        </div>
        <div className="flex-1">
          <h3 className="text-lg font-semibold text-gray-900 mb-1">
            Claim Failed
          </h3>
          <p className="text-sm text-gray-700">{getErrorMessage()}</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button
          variant="primary"
          onClick={onTryAnother}
          className="flex-1 md:flex-none"
        >
          {buttonText}
        </Button>

        {/* Help text for specific errors */}
        {error.code === 'WALLET_NOT_CONNECTED' && (
          <p className="text-xs text-gray-500 mt-2">
            Connect your wallet using the button in the top right corner.
          </p>
        )}
      </div>

      {/* Debug info (only in development) */}
      {process.env.NODE_ENV === 'development' && error.code && (
        <details className="text-xs text-gray-500">
          <summary className="cursor-pointer hover:text-gray-700">
            Error details
          </summary>
          <pre className="mt-2 p-2 bg-gray-50 rounded overflow-x-auto">
            {JSON.stringify(
              {
                code: error.code,
                message: error.message,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}
