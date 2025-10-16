'use client';

import { useEffect, useState } from 'react';
import { Loader2, Wallet, CheckCircle2, AlertCircle } from 'lucide-react';
import type { TransactionState } from '@/hooks/useMUSDTransfer';

interface TransactionStatusProps {
  state: TransactionState;
  txHash: string | null;
  error: Error | null;
  startTime: number | null;
  maxPolls?: number;
}

/**
 * TransactionStatus component displays the current state of a MUSD transfer transaction.
 * Shows appropriate loading states, progress tracking, and transaction links.
 *
 * Features:
 * - Real-time status updates with loading spinners
 * - Progress indicator during confirmation (poll count)
 * - Mezo testnet explorer links for transaction hashes
 * - Timeout warnings after maxPolls exceeded
 * - Fade-in animations for status changes
 * - Accessibility: aria-live announcements, proper labels
 *
 * @param props - Transaction state, hash, error, timing metadata
 *
 * @example
 * <TransactionStatus
 *   state="confirming"
 *   txHash="0x123..."
 *   error={null}
 *   startTime={Date.now()}
 *   maxPolls={30}
 * />
 */
export function TransactionStatus({
  state,
  txHash,
  error,
  startTime,
  maxPolls = 30,
}: TransactionStatusProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [pollCount, setPollCount] = useState(0);

  // Calculate poll count from startTime
  useEffect(() => {
    if (state === 'confirming' && startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const count = Math.floor(elapsed / 2000);
        setPollCount(count);
      }, 500);

      return () => clearInterval(interval);
    }
  }, [state, startTime]);

  // Trigger fade-in animation when status changes
  useEffect(() => {
    setIsVisible(false);
    const timeout = setTimeout(() => setIsVisible(true), 50);
    return () => clearTimeout(timeout);
  }, [state]);

  // Don't render anything in idle state
  if (state === 'idle') {
    return null;
  }

  // Build transaction hash link
  const explorerLink = txHash
    ? `https://explorer.test.mezo.org/tx/${txHash}`
    : null;

  // Determine if timeout warning should be shown
  const showTimeoutWarning = state === 'confirming' && pollCount >= maxPolls;

  return (
    <div
      className={`rounded-lg border border-slate-200 bg-white p-6 shadow-sm transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-live="polite"
      role="status"
    >
      {/* Simulating state */}
      {state === 'simulating' && (
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-teal-500" aria-label="Loading" />
          <span className="text-sm text-slate-700">Preparing transaction...</span>
        </div>
      )}

      {/* Awaiting signature state */}
      {state === 'awaiting_signature' && (
        <div className="flex items-center gap-3">
          <Wallet className="h-5 w-5 text-teal-500" aria-label="Wallet" />
          <span className="text-sm text-slate-700">
            Waiting for wallet confirmation...
          </span>
        </div>
      )}

      {/* Pending state (transaction submitted) */}
      {state === 'pending' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-teal-500" aria-label="Loading" />
            <span className="text-sm text-slate-700">Transaction submitted...</span>
          </div>
          {explorerLink && (
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-600 underline hover:text-teal-700"
              aria-label="View transaction on Mezo Explorer"
            >
              View on Mezo Explorer
            </a>
          )}
        </div>
      )}

      {/* Confirming state (waiting for blockchain confirmation) */}
      {state === 'confirming' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <Loader2 className="h-5 w-5 animate-spin text-teal-500" aria-label="Loading" />
            <span className="text-sm text-slate-700">
              Confirming... ({pollCount} / {maxPolls} polls)
            </span>
          </div>
          {explorerLink && (
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-600 underline hover:text-teal-700"
              aria-label="View transaction on Mezo Explorer"
            >
              View on Mezo Explorer
            </a>
          )}
          {showTimeoutWarning && (
            <div className="mt-2 flex items-start gap-2 rounded-md bg-amber-50 p-3 text-xs text-amber-800">
              <AlertCircle className="h-4 w-4 flex-shrink-0" aria-label="Warning" />
              <span>
                Transaction is taking longer than expected. View on explorer to check
                status manually.
              </span>
            </div>
          )}
        </div>
      )}

      {/* Success state */}
      {state === 'success' && (
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-3">
            <CheckCircle2
              className="h-5 w-5 text-teal-500"
              aria-label="Success checkmark"
            />
            <span className="text-sm font-medium text-teal-700">
              Transaction confirmed!
            </span>
          </div>
          {explorerLink && (
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-600 underline hover:text-teal-700"
              aria-label="View transaction on Mezo Explorer"
            >
              View on Mezo Explorer
            </a>
          )}
        </div>
      )}

      {/* Error state */}
      {state === 'error' && error && (
        <div className="flex flex-col gap-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600" aria-label="Error" />
            <div className="flex flex-col gap-1">
              <span className="text-sm font-medium text-amber-800">
                Transaction failed
              </span>
              <span className="text-xs text-slate-600">{error.message}</span>
            </div>
          </div>
          {explorerLink && (
            <a
              href={explorerLink}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-teal-600 underline hover:text-teal-700"
              aria-label="View transaction on Mezo Explorer"
            >
              View on Mezo Explorer
            </a>
          )}
        </div>
      )}
    </div>
  );
}
