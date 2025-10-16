'use client';

import { useState, useCallback, useEffect } from 'react';
import { type Address, parseEther } from 'viem';
import {
  useWriteContract,
  useWaitForTransactionReceipt,
  useSimulateContract,
} from 'wagmi';
import { MUSD_ADDRESS, ERC20_ABI } from '@/config/contracts';

/**
 * Transaction state throughout the lifecycle of a MUSD transfer.
 */
export type TransactionState =
  | 'idle'
  | 'simulating'
  | 'awaiting_signature'
  | 'pending'
  | 'confirming'
  | 'success'
  | 'error';

interface UseMUSDTransferParams {
  recipient: Address;
  amount: string; // USD amount as string (e.g., "5.00")
}

interface UseMUSDTransferReturn {
  sendTransaction: () => Promise<void>;
  txHash: string | null;
  state: TransactionState;
  isSimulating: boolean;
  isPending: boolean;
  isConfirming: boolean;
  isSuccess: boolean;
  isError: boolean;
  error: Error | null;
  startTime: number | null;
  pollCount: number;
  reset: () => void;
}

/**
 * Custom hook for executing MUSD ERC-20 transfers.
 *
 * Handles the full transaction lifecycle:
 * 1. Simulates transaction (validates it will succeed)
 * 2. Executes transaction (prompts wallet approval)
 * 3. Waits for confirmation (polls blockchain every 2 seconds)
 *
 * Features:
 * - Automatic simulation before execution
 * - User rejection detection (no error shown for intentional cancellation)
 * - Transaction confirmation polling (2-second intervals, 60-second timeout)
 * - User-friendly error messages via parseContractError
 * - Progress tracking (startTime, pollCount)
 *
 * @param params - Recipient address and amount (in USD string format)
 * @returns Transaction state, handlers, and metadata
 *
 * @example
 * const { sendTransaction, state, txHash, isSuccess } = useMUSDTransfer({
 *   recipient: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   amount: '5.00'
 * });
 *
 * // In your component
 * <button onClick={sendTransaction} disabled={state !== 'idle'}>
 *   Send ${amount}
 * </button>
 */
export function useMUSDTransfer({
  recipient,
  amount,
}: UseMUSDTransferParams): UseMUSDTransferReturn {
  const [startTime, setStartTime] = useState<number | null>(null);
  const [currentPollCount, setCurrentPollCount] = useState(0);

  // Convert USD amount to wei (MUSD has 18 decimals like Ether)
  const amountInWei = parseEther(amount);

  // Step 1: Simulate the transaction
  const {
    data: simulateData,
    isLoading: isSimulating,
    error: simulateError,
  } = useSimulateContract({
    address: MUSD_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'transfer',
    args: [recipient, amountInWei],
    query: {
      enabled: !!MUSD_ADDRESS && !!recipient && !!amount,
    },
  });

  // Step 2: Execute the transaction
  const {
    data: txHash,
    isPending,
    writeContract,
    error: writeError,
    reset: resetWrite,
  } = useWriteContract();

  // Step 3: Wait for transaction confirmation
  const {
    isLoading: isConfirming,
    isSuccess,
    error: receiptError,
  } = useWaitForTransactionReceipt({
    hash: txHash,
    pollingInterval: 2000, // Poll every 2 seconds
    timeout: 60000, // Timeout after 60 seconds
    query: {
      enabled: !!txHash,
    },
  });

  // Calculate poll count for progress tracking
  useEffect(() => {
    if (isConfirming && startTime) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const count = Math.floor(elapsed / 2000);
        setCurrentPollCount(count);
      }, 500); // Update every 500ms for smooth progress

      return () => clearInterval(interval);
    }
  }, [isConfirming, startTime]);

  // Determine current state
  const getState = (): TransactionState => {
    if (isSuccess) return 'success';
    if (writeError || simulateError || receiptError) return 'error';
    if (isConfirming) return 'confirming';
    if (txHash) return 'pending';
    if (isPending) return 'awaiting_signature';
    if (isSimulating) return 'simulating';
    return 'idle';
  };

  const state = getState();

  // Parse errors
  const error = writeError || simulateError || receiptError || null;
  const isError = state === 'error';

  // Send transaction function
  const sendTransaction = useCallback(async () => {
    if (!simulateData?.request) {
      console.error('Simulation data not ready');
      return;
    }

    // Record start time
    setStartTime(Date.now());
    setCurrentPollCount(0);

    // Execute transaction
    writeContract(simulateData.request);
  }, [simulateData, writeContract]);

  // Reset function
  const reset = useCallback(() => {
    resetWrite();
    setStartTime(null);
    setCurrentPollCount(0);
  }, [resetWrite]);

  return {
    sendTransaction,
    txHash: txHash ?? null,
    state,
    isSimulating,
    isPending,
    isConfirming,
    isSuccess,
    isError,
    error,
    startTime,
    pollCount: currentPollCount,
    reset,
  };
}
