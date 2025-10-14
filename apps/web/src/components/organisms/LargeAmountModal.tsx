/**
 * Large amount confirmation modal
 *
 * Features:
 * - Radix UI Dialog for accessibility
 * - Focus trap and keyboard navigation
 * - Escape key closes modal
 * - Responsive layout
 * - Dynamic amount display
 */

'use client';

import * as Dialog from '@radix-ui/react-dialog';
import { Button } from '../atoms/Button';
import { formatCurrency } from '@/lib/formatting';

export interface LargeAmountModalProps {
  /**
   * Modal open state
   */
  isOpen: boolean;

  /**
   * Amount to display (as string)
   */
  amount: string;

  /**
   * Callback when user confirms
   */
  onConfirm: () => void;

  /**
   * Callback when user cancels or closes
   */
  onCancel: () => void;
}

/**
 * LargeAmountModal organism component
 *
 * @example
 * ```tsx
 * <LargeAmountModal
 *   isOpen={showModal}
 *   amount="500"
 *   onConfirm={handleSend}
 *   onCancel={() => setShowModal(false)}
 * />
 * ```
 */
export function LargeAmountModal({
  isOpen,
  amount,
  onConfirm,
  onCancel,
}: LargeAmountModalProps) {
  const formattedAmount = formatCurrency(amount);

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <Dialog.Portal>
        {/* Backdrop */}
        <Dialog.Overlay className="fixed inset-0 bg-black/50 z-40 animate-[fade-in_150ms_ease-out]" />

        {/* Modal Content */}
        <Dialog.Content
          className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-[90vw] max-w-[400px] bg-white rounded-[var(--radius-card)] p-6 shadow-lg animate-[scale-in_150ms_ease-out] focus:outline-none"
          aria-modal="true"
        >
          {/* Title */}
          <Dialog.Title className="text-[1.5rem] font-semibold text-[var(--color-neutral-charcoal)] mb-3">
            Confirm large amount
          </Dialog.Title>

          {/* Description */}
          <Dialog.Description className="text-[1rem] text-[var(--color-neutral-600)] mb-6">
            You&apos;re about to send {formattedAmount}. Is this correct?
          </Dialog.Description>

          {/* Actions */}
          <div className="flex flex-col-reverse sm:flex-row gap-3 sm:justify-end">
            <Button
              variant="secondary"
              onClick={onCancel}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              onClick={onConfirm}
              className="w-full sm:w-auto"
            >
              Yes, send {formattedAmount}
            </Button>
          </div>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
