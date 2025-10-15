'use client';

import { useState, useEffect } from 'react';
import { Wallet } from 'lucide-react';

// Loading timeout (10 seconds)
const LOADING_TIMEOUT_MS = 10000;

interface BalanceDisplayProps {
  balance: string | null;
  isLoading: boolean;
  onRetry?: () => void;
}

/**
 * BalanceDisplay component shows MUSD balance with loading and error states.
 * Displays faucet link when balance is zero.
 *
 * @param props - Balance string and loading state
 *
 * @example
 * <BalanceDisplay balance="15.30" isLoading={false} />
 */
export function BalanceDisplay({ balance, isLoading, onRetry }: BalanceDisplayProps) {
  const [showTimeout, setShowTimeout] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Handle loading timeout
  useEffect(() => {
    if (isLoading) {
      const timeoutId = setTimeout(() => {
        setShowTimeout(true);
      }, LOADING_TIMEOUT_MS);

      return () => clearTimeout(timeoutId);
    } else {
      setShowTimeout(false);
      // Trigger fade-in animation when balance loads
      setIsVisible(true);
    }
  }, [isLoading]);

  // Handle timeout retry
  const handleRetry = () => {
    setShowTimeout(false);
    if (onRetry) {
      onRetry();
    } else {
      // Fallback to reload if no onRetry provided
      window.location.reload();
    }
  };

  // Loading timeout error state
  if (showTimeout) {
    return (
      <div className="flex items-center gap-2 text-sm text-red-600">
        <Wallet className="h-4 w-4" />
        <span>Unable to fetch balance. Check wallet connection.</span>
        <button
          onClick={handleRetry}
          className="ml-2 text-coral-500 underline hover:text-coral-600"
          aria-label="Retry fetching balance"
        >
          Retry
        </button>
      </div>
    );
  }

  // Loading state with skeleton
  if (isLoading || balance === null) {
    return (
      <div className="flex items-center gap-2 text-sm text-slate-600">
        <Wallet className="h-4 w-4 text-teal-500" />
        <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      </div>
    );
  }

  // Zero balance case
  if (balance === '0.00') {
    return (
      <div
        className={`flex flex-col gap-1 text-sm text-slate-600 transition-opacity duration-300 sm:flex-row sm:items-center sm:gap-2 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
        aria-label="MUSD balance display"
        aria-live="polite"
      >
        <div className="flex items-center gap-2">
          <Wallet className="h-4 w-4 text-teal-500" />
          <span>You have 0 MUSD</span>
        </div>
        <a
          href="https://faucet.test.mezo.org"
          target="_blank"
          rel="noopener noreferrer"
          className="text-coral-500 underline hover:text-coral-600"
        >
          Get MUSD from testnet faucet
        </a>
      </div>
    );
  }

  // Normal balance display
  return (
    <div
      className={`flex items-center gap-2 text-sm text-slate-600 transition-opacity duration-300 ${
        isVisible ? 'opacity-100' : 'opacity-0'
      }`}
      aria-label="MUSD balance display"
      aria-live="polite"
    >
      <Wallet className="h-4 w-4 text-teal-500" />
      <span>Your MUSD balance: ${balance}</span>
    </div>
  );
}
