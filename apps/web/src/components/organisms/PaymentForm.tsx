/**
 * Payment form organism with amount input and gas estimation
 *
 * Features:
 * - Amount input with quick-select chips
 * - Real-time gas fee estimation
 * - Economic viability warnings
 * - Large amount confirmation modal
 * - Send button with dynamic labeling
 */

'use client';

import { useState, useCallback } from 'react';
import { parseEther, type Address } from 'viem';
import { AmountInput } from '../molecules/AmountInput';
import { QuickAmountChips } from '../molecules/QuickAmountChips';
import { GasFeeDisplay } from '../molecules/GasFeeDisplay';
import { SendButton } from '../molecules/SendButton';
import { LargeAmountModal } from './LargeAmountModal';
import { useGasEstimation } from '@/hooks/useGasEstimation';

const LARGE_AMOUNT_THRESHOLD = 100; // $100

export interface PaymentFormProps {
  /**
   * Recipient address for gas estimation
   */
  recipientAddress: Address;

  /**
   * Pre-filled amount (optional, from URL parameter)
   */
  prefillAmount?: number | undefined;

  /**
   * Callback when send button is clicked and confirmed
   */
  onSend?: (amount: string) => void;
}

/**
 * PaymentForm organism component
 *
 * @example
 * ```tsx
 * <PaymentForm
 *   recipientAddress="0x..."
 *   prefillAmount={5}
 *   onSend={(amount) => console.log('Sending', amount)}
 * />
 * ```
 */
export function PaymentForm({
  recipientAddress,
  prefillAmount,
  onSend,
}: PaymentFormProps) {
  // Amount state (as string for input compatibility)
  const [amount, setAmount] = useState<string>(
    prefillAmount !== undefined ? prefillAmount.toFixed(2) : ''
  );

  // Large amount modal state
  const [showLargeAmountModal, setShowLargeAmountModal] =
    useState<boolean>(false);

  // Convert amount string to bigint for gas estimation
  const amountBigInt =
    amount && parseFloat(amount) > 0 ? parseEther(amount) : BigInt(0);

  // Gas estimation hook
  const { gasEstimateUsd, isLoading: isEstimatingGas } = useGasEstimation({
    amount: amountBigInt,
    recipientAddress,
  });

  // Handle quick amount chip selection
  const handleQuickAmountSelect = useCallback((selectedAmount: number) => {
    setAmount(selectedAmount.toFixed(2));
  }, []);

  // Handle send button click
  const handleSendClick = useCallback(() => {
    const numericAmount = parseFloat(amount);

    // Check if amount exceeds large amount threshold
    if (numericAmount > LARGE_AMOUNT_THRESHOLD) {
      setShowLargeAmountModal(true);
    } else {
      // Proceed with send
      onSend?.(amount);
    }
  }, [amount, onSend]);

  // Handle large amount confirmation
  const handleLargeAmountConfirm = useCallback(() => {
    setShowLargeAmountModal(false);
    onSend?.(amount);
  }, [amount, onSend]);

  // Handle large amount cancel
  const handleLargeAmountCancel = useCallback(() => {
    setShowLargeAmountModal(false);
  }, []);

  // Validate amount for send button
  const numericAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numericAmount) && numericAmount > 0;

  return (
    <div className="flex flex-col gap-6">
      {/* Quick amount chips */}
      <QuickAmountChips onSelectAmount={handleQuickAmountSelect} />

      {/* Amount input */}
      <AmountInput value={amount} onChange={setAmount} />

      {/* Gas fee display */}
      {isValidAmount && (
        <GasFeeDisplay
          tipAmount={amountBigInt}
          gasEstimateUsd={gasEstimateUsd}
          isLoading={isEstimatingGas}
        />
      )}

      {/* Send button */}
      <SendButton
        amount={amount}
        disabled={!isValidAmount}
        onClick={handleSendClick}
      />

      {/* Large amount confirmation modal */}
      <LargeAmountModal
        isOpen={showLargeAmountModal}
        amount={amount}
        onConfirm={handleLargeAmountConfirm}
        onCancel={handleLargeAmountCancel}
      />
    </div>
  );
}
