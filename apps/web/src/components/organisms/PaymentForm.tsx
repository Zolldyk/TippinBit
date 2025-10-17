/**
 * Payment form organism with amount input and gas estimation
 *
 * Features:
 * - Amount input with quick-select chips
 * - Real-time gas fee estimation
 * - Economic viability warnings
 * - Large amount confirmation modal
 * - Send button with dynamic labeling
 * - MUSD transfer execution with transaction tracking
 */

'use client';

import { useState, useCallback, useMemo, useEffect } from 'react';
import { parseEther, formatEther, type Address } from 'viem';
import { useAccount } from 'wagmi';
import { useRouter } from 'next/navigation';
import { AmountInput } from '../molecules/AmountInput';
import { QuickAmountChips } from '../molecules/QuickAmountChips';
import { GasFeeDisplay } from '../molecules/GasFeeDisplay';
import { SendButton } from '../molecules/SendButton';
import { BalanceDisplay } from '../molecules/BalanceDisplay';
import { SendMaxButton } from '../molecules/SendMaxButton';
import { InsufficientBalanceWarning } from '../molecules/InsufficientBalanceWarning';
import { TransactionStatus } from '../molecules/TransactionStatus';
import { LargeAmountModal } from './LargeAmountModal';
import { useGasEstimation } from '@/hooks/useGasEstimation';
import { useBalanceMonitor } from '@/hooks/useBalanceMonitor';
import { useMUSDTransfer } from '@/hooks/useMUSDTransfer';
import { parseContractError } from '@/lib/error-parser';
import { MUSD_ADDRESS } from '@/config/contracts';

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

  // Get connected wallet address
  const { address: walletAddress } = useAccount();

  // Router for redirects
  const router = useRouter();

  // Balance monitoring hook
  const {
    balance,
    balanceUsd,
    isLoading: isLoadingBalance,
    refetch: refetchBalance,
    updateOptimistically,
  } = useBalanceMonitor({
    address: walletAddress,
    musdAddress: MUSD_ADDRESS!,
  });

  // Convert amount string to bigint for gas estimation
  const amountBigInt =
    amount && parseFloat(amount) > 0 ? parseEther(amount) : BigInt(0);

  // Gas estimation hook
  const {
    gasEstimate,
    gasEstimateUsd,
    isLoading: isEstimatingGas,
    gasEstimationFailed,
  } = useGasEstimation({
    amount: amountBigInt,
    recipientAddress,
  });

  // MUSD transfer hook
  const {
    sendTransaction,
    txHash,
    state: txState,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error: txError,
    startTime,
    reset: resetTransaction,
  } = useMUSDTransfer({
    recipient: recipientAddress,
    amount: amount || '0',
  });

  // Handle quick amount chip selection
  const handleQuickAmountSelect = useCallback((selectedAmount: number) => {
    setAmount(selectedAmount.toFixed(2));
  }, []);

  // Calculate total cost and check insufficient balance
  const totalCost = useMemo(() => {
    return amountBigInt + (gasEstimate ?? BigInt(0));
  }, [amountBigInt, gasEstimate]);

  const hasInsufficientBalance = useMemo(() => {
    if (balance === null || !gasEstimate) return false;
    return totalCost > balance;
  }, [balance, totalCost, gasEstimate]);

  // Handle send button click
  const handleSendClick = useCallback(async () => {
    const numericAmount = parseFloat(amount);

    // Double-check balance before transaction
    if (balance !== null && gasEstimate) {
      await refetchBalance();
      if (totalCost > balance) {
        // Show insufficient balance warning (already shown in UI)
        return;
      }
    }

    // Check if amount exceeds large amount threshold
    if (numericAmount > LARGE_AMOUNT_THRESHOLD) {
      setShowLargeAmountModal(true);
    } else {
      // Execute transaction
      await sendTransaction();
      onSend?.(amount);
      // Update balance optimistically
      if (amountBigInt > BigInt(0)) {
        updateOptimistically(amountBigInt);
      }
    }
  }, [amount, onSend, balance, gasEstimate, totalCost, refetchBalance, amountBigInt, updateOptimistically, sendTransaction]);

  // Handle large amount confirmation
  const handleLargeAmountConfirm = useCallback(async () => {
    setShowLargeAmountModal(false);
    // Execute transaction
    await sendTransaction();
    onSend?.(amount);
    // Update balance optimistically
    if (amountBigInt > BigInt(0)) {
      updateOptimistically(amountBigInt);
    }
  }, [amount, onSend, amountBigInt, updateOptimistically, sendTransaction]);

  // Handle large amount cancel
  const handleLargeAmountCancel = useCallback(() => {
    setShowLargeAmountModal(false);
  }, []);

  // Validate amount for send button
  const numericAmount = parseFloat(amount);
  const isValidAmount = !isNaN(numericAmount) && numericAmount > 0;

  // Handle SendMaxButton click
  const handleSetMaxAmount = useCallback((maxAmount: bigint) => {
    setAmount(formatEther(maxAmount));
  }, []);

  // Handle successful transaction (Task 8: redirect to confirmation page)
  useEffect(() => {
    if (isSuccess && txHash) {
      // Wait 1 second to show success status, then redirect
      const timeout = setTimeout(() => {
        router.push(`/confirmation?tx=${txHash}`);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [isSuccess, txHash, router]);

  // Handle transaction errors (Task 9: inline error handling)
  useEffect(() => {
    if (isError && txError) {
      const parsedError = parseContractError(txError);
      // If user rejection, silently reset (no error shown)
      if (parsedError.isUserRejection) {
        resetTransaction();
      }
      // For other errors, TransactionStatus component will display them
    }
  }, [isError, txError, resetTransaction]);

  // Reset transaction when amount changes
  useEffect(() => {
    if (txState !== 'idle') {
      resetTransaction();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [amount]); // Only amount changes, not txState or resetTransaction to avoid loops

  return (
    <div className="flex flex-col gap-6">
      {/* Balance display */}
      {walletAddress && MUSD_ADDRESS && (
        <BalanceDisplay
          balance={balanceUsd}
          isLoading={isLoadingBalance}
          onRetry={refetchBalance}
        />
      )}

      {/* Quick amount chips */}
      <QuickAmountChips onSelectAmount={handleQuickAmountSelect} />

      {/* Amount input with Send Max button */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
        <div className="flex-1">
          <AmountInput value={amount} onChange={setAmount} />
        </div>
        {balance !== null && balance > BigInt(0) && gasEstimate && (
          <SendMaxButton
            balance={balance}
            gasEstimate={gasEstimate}
            onSetAmount={handleSetMaxAmount}
          />
        )}
      </div>

      {/* Gas fee display - show for all valid amounts */}
      {isValidAmount && (
        <GasFeeDisplay
          tipAmount={amountBigInt}
          gasEstimateUsd={gasEstimateUsd}
          isLoading={isEstimatingGas}
          gasEstimationFailed={gasEstimationFailed}
        />
      )}

      {/* Insufficient balance warning */}
      {hasInsufficientBalance && balanceUsd && gasEstimateUsd && (
        <InsufficientBalanceWarning
          balance={balanceUsd}
          tipAmount={amount}
          gasEstimate={gasEstimateUsd}
        />
      )}

      {/* Transaction status display */}
      {txState !== 'idle' && (
        <TransactionStatus
          state={txState}
          txHash={txHash}
          error={txError}
          startTime={startTime}
        />
      )}

      {/* Send button */}
      <SendButton
        amount={amount}
        disabled={!isValidAmount || hasInsufficientBalance}
        isLoading={isPending || isConfirming}
        onClick={handleSendClick}
        insufficientBalance={hasInsufficientBalance}
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
