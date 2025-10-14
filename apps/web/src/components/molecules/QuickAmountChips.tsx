/**
 * Quick amount selection chips
 *
 * Features:
 * - Pre-defined popular amounts ($3, $5, $10, $25)
 * - Accessible keyboard navigation
 * - 44px minimum touch target
 * - Responsive layout (wraps on mobile)
 */

'use client';

import { Button } from '../atoms/Button';

const QUICK_AMOUNTS = [3, 5, 10, 25] as const;

export interface QuickAmountChipsProps {
  /**
   * Callback when an amount is selected
   */
  onSelectAmount: (amount: number) => void;
}

/**
 * QuickAmountChips molecule component
 *
 * @example
 * ```tsx
 * <QuickAmountChips
 *   onSelectAmount={(amount) => setAmount(amount.toString())}
 * />
 * ```
 */
export function QuickAmountChips({ onSelectAmount }: QuickAmountChipsProps) {
  return (
    <div className="flex flex-col gap-2">
      <span className="sr-only">Popular amounts</span>
      <div className="flex flex-wrap gap-2">
        {QUICK_AMOUNTS.map((amount) => (
          <Button
            key={amount}
            variant="secondary"
            onClick={() => onSelectAmount(amount)}
            className="min-h-[44px] hover:scale-105 transition-transform duration-150"
            aria-label={`Select ${amount} dollars`}
          >
            ${amount}
          </Button>
        ))}
      </div>
    </div>
  );
}
