/**
 * TipWithBtcButton - Secondary button for initiating BTC borrowing flow
 * Always visible regardless of BTC balance (Story 2.12)
 *
 * Features:
 * - Always visible with static tooltip
 * - Pre-flight validation in PaymentForm
 * - Disabled state when BTC < minimum collateral
 * - Responsive mobile layout
 */

'use client';

import { Info } from 'lucide-react';
import * as Tooltip from '@radix-ui/react-tooltip';
import { Button } from '../atoms/Button';

export interface TipWithBtcButtonProps {
  /** BTC balance in wei (18 decimals) - kept for future use but not used for visibility */
  btcBalance: bigint | null;
  /** Whether button should be disabled */
  isDisabled: boolean;
  /** Click handler for button */
  onClick: () => void;
}

/**
 * Secondary button for initiating BTC borrowing flow
 * Always visible to improve discoverability (Story 2.12)
 *
 * @example
 * <TipWithBtcButton
 *   btcBalance={parseEther('0.005')}
 *   isDisabled={false}
 *   onClick={handleBorrowFlow}
 * />
 */
export function TipWithBtcButton({
  btcBalance: _btcBalance,
  isDisabled,
  onClick,
}: TipWithBtcButtonProps) {
  // Static tooltip message (Story 2.12 AC 7)
  const tooltipMessage = 'Borrow MUSD using your BTC as collateral';

  return (
    <Tooltip.Provider>
      <Tooltip.Root>
        <Tooltip.Trigger asChild>
          <Button
            variant="secondary"
            onClick={onClick}
            disabled={isDisabled}
            className="w-full sm:w-auto border-2 border-amber-400 text-amber-600 hover:bg-amber-50 hover:text-amber-600 active:bg-amber-100 active:border-amber-400 disabled:opacity-50 disabled:bg-transparent disabled:border-amber-200 disabled:text-amber-300"
            aria-label="Tip with BTC - borrow MUSD using Bitcoin as collateral"
          >
            <Info className="h-4 w-4" />
            Tip with BTC
          </Button>
        </Tooltip.Trigger>
        <Tooltip.Portal>
          <Tooltip.Content
            className="bg-slate-800 text-white px-3 py-2 rounded-lg text-sm max-w-xs z-50"
            sideOffset={5}
          >
            {tooltipMessage}
            <Tooltip.Arrow className="fill-slate-800" />
          </Tooltip.Content>
        </Tooltip.Portal>
      </Tooltip.Root>
    </Tooltip.Provider>
  );
}
