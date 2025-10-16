/**
 * Gas fee display component with economic viability warning
 *
 * Features:
 * - Shows total cost including gas fees
 * - Skeleton loader during estimation
 * - Economic viability warning (amber) when tip < 2x gas
 * - Accessible with aria-live for updates
 */

'use client';

import { formatEther } from 'viem';
import { AlertTriangle } from 'lucide-react';
import { formatCurrency } from '@/lib/formatting';

export interface GasFeeDisplayProps {
  /**
   * Tip amount in wei (bigint)
   */
  tipAmount: bigint;

  /**
   * Gas estimate in USD (formatted string)
   */
  gasEstimateUsd: string | null;

  /**
   * Loading state
   */
  isLoading: boolean;

  /**
   * Gas estimation failed flag (shows fallback warning)
   */
  gasEstimationFailed?: boolean;
}

/**
 * GasFeeDisplay molecule component
 *
 * @example
 * ```tsx
 * <GasFeeDisplay
 *   tipAmount={parseEther('5')}
 *   gasEstimateUsd="0.15"
 *   isLoading={false}
 * />
 * ```
 */
export function GasFeeDisplay({
  tipAmount,
  gasEstimateUsd,
  isLoading,
  gasEstimationFailed = false,
}: GasFeeDisplayProps) {
  // Skip rendering if no tip amount
  if (tipAmount === BigInt(0)) {
    return null;
  }

  // Loading skeleton
  if (isLoading) {
    return (
      <div
        className="flex flex-col gap-2 animate-pulse"
        role="status"
        aria-live="polite"
        aria-busy="true"
      >
        <div className="h-4 w-64 bg-[var(--color-neutral-200)] rounded" />
      </div>
    );
  }

  // No gas estimate available
  if (!gasEstimateUsd) {
    return null;
  }

  // Convert tip amount from wei to USD string
  const tipAmountEth = formatEther(tipAmount);
  const tipAmountUsd = Number(tipAmountEth);

  // Calculate total cost
  const gasUsd = Number(gasEstimateUsd);
  const totalCostUsd = tipAmountUsd + gasUsd;

  // Economic viability check (tip < 2x gas)
  const isUneconomical = tipAmountUsd < gasUsd * 2;
  const feePercentage = Math.round((gasUsd / tipAmountUsd) * 100);

  return (
    <div className="flex flex-col gap-2" aria-live="polite">
      {/* Gas estimation fallback warning */}
      {gasEstimationFailed && (
        <div
          className="flex items-start gap-2 p-3 rounded-[var(--radius-card)] bg-amber-50 border border-amber-200"
          role="alert"
        >
          <AlertTriangle
            size={20}
            strokeWidth={1.5}
            className="text-amber-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-[0.875rem] text-amber-800">
            Unable to estimate gas. Using default estimate. Transaction may fail or
            cost more.
          </p>
        </div>
      )}

      {/* Total cost display */}
      <p className="text-[0.875rem] text-[var(--color-neutral-600)]">
        Total cost: ~{formatCurrency(totalCostUsd.toFixed(2))} (includes ~
        {formatCurrency(gasEstimateUsd)} network fee)
      </p>

      {/* Economic viability warning */}
      {isUneconomical && !gasEstimationFailed && (
        <div
          className="flex items-start gap-2 p-3 rounded-[var(--radius-card)] bg-amber-50 border border-amber-200"
          role="alert"
        >
          <AlertTriangle
            size={20}
            strokeWidth={1.5}
            className="text-amber-600 flex-shrink-0 mt-0.5"
            aria-hidden="true"
          />
          <p className="text-[0.875rem] text-amber-800">
            Network fees (~{formatCurrency(gasEstimateUsd)}) are {feePercentage}
            % of your tip. Consider ${Math.ceil(gasUsd * 2)}+ for better value.
          </p>
        </div>
      )}
    </div>
  );
}
