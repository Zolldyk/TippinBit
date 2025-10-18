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

  // Failure counter state (AC7: Track repeated failures)
  const [failureCount, setFailureCount] = useState<number>(() => {
    // Load from sessionStorage on mount
    if (typeof window !== 'undefined') {
      const stored = sessionStorage.getItem('tx_failure_count');
      return stored ? parseInt(stored, 10) : 0;
    }
    return 0;
  });

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
      // Reset failure counter on successful transaction (AC7)
      setFailureCount(0);
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('tx_failure_count', '0');
      }

      // Wait 1 second to show success status, then redirect
      const timeout = setTimeout(() => {
        // Format amount to 2 decimal places for URL
        const formattedAmount = parseFloat(amount).toFixed(2);
        // Build confirmation URL with amount and recipient
        const confirmationUrl = `/confirmation?tx=${txHash}&amount=${formattedAmount}&recipient=${encodeURIComponent(recipientAddress)}`;
        router.push(confirmationUrl);
      }, 1000);

      return () => clearTimeout(timeout);
    }
  }, [isSuccess, txHash, router, amount, recipientAddress]);

  // Handle transaction errors (Task 9: inline error handling)
  useEffect(() => {
    if (isError && txError) {
      const parsedError = parseContractError(txError);
      // If user rejection, silently reset (no error shown)
      if (parsedError.isUserRejection) {
        resetTransaction();
      } else {
        // Increment failure counter for non-rejection errors (AC7)
        const newCount = failureCount + 1;
        setFailureCount(newCount);
        if (typeof window !== 'undefined') {
          sessionStorage.setItem('tx_failure_count', newCount.toString());
        }
      }
      // For other errors, TransactionStatus component will display them
    }
  }, [isError, txError, resetTransaction, failureCount]);

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

      {/* Help section after 3 failures (AC7) */}
      {failureCount >= 3 && (
        <div className="rounded-lg border border-amber-300 bg-amber-50 p-4">
          <h3 className="text-sm font-semibold text-amber-900 mb-3">
            Need help?
          </h3>
          <p className="text-sm text-amber-800 mb-4">
            Having trouble? Here are some resources:
          </p>
          <div className="space-y-3">
            <div>
              <a
                href="https://faucet.test.mezo.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900 underline"
              >
                Get MUSD from testnet faucet
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </a>
            </div>
            <div>
              <a
                href="https://docs.mezo.org"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-amber-700 hover:text-amber-900 underline"
              >
                View troubleshooting guide
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                  strokeWidth={1.5}
                  stroke="currentColor"
                  className="w-4 h-4"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                  />
                </svg>
              </a>
            </div>
          </div>
        </div>
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
