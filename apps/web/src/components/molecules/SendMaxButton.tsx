'use client';

import { formatEther } from 'viem';
import { Button } from '@/components/atoms/Button';
import { calculateMaxSendable } from '@/lib/formatting';
import { useState } from 'react';

interface SendMaxButtonProps {
  balance: bigint;
  gasEstimate: bigint;
  onSetAmount: (amount: bigint) => void;
}

/**
 * SendMaxButton calculates and displays the maximum sendable amount (balance - gas).
 * Pre-fills the amount input when clicked.
 *
 * @param props - Balance, gas estimate, and amount setter callback
 *
 * @example
 * <SendMaxButton
 *   balance={parseEther('15')}
 *   gasEstimate={parseEther('0.15')}
 *   onSetAmount={(amount) => setTipAmount(formatEther(amount))}
 * />
 */
export function SendMaxButton({
  balance,
  gasEstimate,
  onSetAmount,
}: SendMaxButtonProps) {
  const [showTooltip, setShowTooltip] = useState(false);

  // Calculate max sendable amount
  const maxSendable = calculateMaxSendable(balance, gasEstimate);
  const isDisabled = maxSendable === BigInt(0);

  // Format for display
  const maxSendableFormatted = formatEther(maxSendable);
  const maxSendableUsd = Number(maxSendableFormatted).toFixed(2);

  const handleClick = () => {
    if (!isDisabled) {
      onSetAmount(maxSendable);
    }
  };

  const ariaLabel = isDisabled
    ? 'Send max button disabled: Your balance is too low to cover network fees'
    : `Send your max: $${maxSendableUsd}`;

  return (
    <div className="relative inline-block">
      <Button
        variant="secondary"
        onClick={handleClick}
        disabled={isDisabled}
        className="text-sm py-2 px-3 min-h-[44px]"
        aria-label={ariaLabel}
        aria-disabled={isDisabled}
        onMouseEnter={() => setShowTooltip(true)}
        onMouseLeave={() => setShowTooltip(false)}
        onFocus={() => setShowTooltip(true)}
        onBlur={() => setShowTooltip(false)}
      >
        Send your max: ${maxSendableUsd}
      </Button>

      {/* Tooltip */}
      {showTooltip && (
        <div
          className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs rounded bg-slate-800 px-3 py-2 text-sm text-white shadow-lg z-10"
          role="tooltip"
        >
          {isDisabled
            ? 'Your balance is too low to cover network fees'
            : 'This calculates your balance minus estimated gas fees'}
        </div>
      )}
    </div>
  );
}
