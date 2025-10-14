/**
 * Send button with dynamic labeling
 *
 * Features:
 * - Dynamic label based on amount state
 * - Loading state with spinner
 * - Disabled state for invalid amounts
 * - Accessibility compliant
 */

'use client';

import { Button } from '../atoms/Button';
import { formatCurrency } from '@/lib/formatting';

export interface SendButtonProps {
  /**
   * Amount to send (as string)
   */
  amount: string;

  /**
   * Disabled state
   */
  disabled: boolean;

  /**
   * Click handler
   */
  onClick: () => void;

  /**
   * Loading state
   */
  isLoading?: boolean;
}

/**
 * SendButton molecule component
 *
 * @example
 * ```tsx
 * <SendButton
 *   amount="12.50"
 *   disabled={!isValid}
 *   onClick={handleSend}
 * />
 * ```
 */
export function SendButton({
  amount,
  disabled,
  onClick,
  isLoading = false,
}: SendButtonProps) {
  // Parse amount to check validity
  const numericAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numericAmount) && numericAmount > 0;

  // Determine button label
  let label = 'Enter amount';
  if (isLoading) {
    label = 'Sending...';
  } else if (isValidAmount) {
    label = `Send ${formatCurrency(amount)}`;
  }

  // Determine if button should be disabled
  const isDisabled = disabled || !isValidAmount;

  return (
    <Button
      variant="primary"
      onClick={onClick}
      disabled={isDisabled}
      loading={isLoading}
      className="w-full sm:w-auto"
      aria-label={isValidAmount ? `Send ${formatCurrency(amount)}` : label}
      aria-disabled={isDisabled}
    >
      {label}
    </Button>
  );
}
