'use client';

import { AlertCircle } from 'lucide-react';
import { useState, useEffect } from 'react';

interface InsufficientBalanceWarningProps {
  balance: string;
  tipAmount?: string; // Currently unused, reserved for future enhancements
  gasEstimate?: string; // Currently unused, reserved for future enhancements
}

/**
 * InsufficientBalanceWarning displays a warning when user has insufficient balance.
 * Shows actionable suggestions including faucet link and BTC option.
 *
 * @param props - Balance, tip amount, and gas estimate for warning message
 *
 * @example
 * <InsufficientBalanceWarning
 *   balance="12.00"
 *   tipAmount="15.00"
 *   gasEstimate="0.50"
 * />
 */
export function InsufficientBalanceWarning({
  balance,
}: InsufficientBalanceWarningProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [showBtcTooltip, setShowBtcTooltip] = useState(false);

  // Trigger slide-down animation on mount
  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div
      className={`flex flex-col gap-2 rounded-lg border-2 border-coral-500 bg-amber-50 p-4 text-sm text-amber-700 transition-all duration-200 sm:flex-row sm:items-start sm:gap-3 ${
        isVisible ? 'translate-y-0 opacity-100' : '-translate-y-2 opacity-0'
      }`}
      role="alert"
      aria-live="assertive"
    >
      {/* Icon */}
      <AlertCircle className="h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" />

      {/* Content */}
      <div className="flex-1">
        {/* Warning message */}
        <p className="font-medium">
          You have ${balance} MUSD. Reduce amount or try &apos;Tip with BTC&apos;
          option.
        </p>

        {/* Suggested actions */}
        <div className="mt-2 flex flex-col gap-2 text-sm sm:flex-row sm:flex-wrap sm:gap-4">
          <a
            href="https://faucet.test.mezo.org"
            target="_blank"
            rel="noopener noreferrer"
            className="text-coral-500 underline hover:text-coral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2"
          >
            Get MUSD from testnet faucet
          </a>

          <div className="relative inline-block">
            <button
              type="button"
              className="text-coral-500 underline hover:text-coral-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-coral-500 focus-visible:ring-offset-2"
              onMouseEnter={() => setShowBtcTooltip(true)}
              onMouseLeave={() => setShowBtcTooltip(false)}
              onFocus={() => setShowBtcTooltip(true)}
              onBlur={() => setShowBtcTooltip(false)}
              aria-label="Use Tip with BTC instead (Coming soon)"
            >
              Use Tip with BTC instead
            </button>

            {/* Coming soon tooltip */}
            {showBtcTooltip && (
              <div
                className="absolute top-full left-0 mt-1 w-max rounded bg-slate-800 px-3 py-2 text-sm text-white shadow-lg z-10"
                role="tooltip"
              >
                Coming soon
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
