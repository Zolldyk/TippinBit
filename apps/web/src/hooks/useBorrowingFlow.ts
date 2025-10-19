'use client';

import { useState, useCallback } from 'react';
import { type Address, type Hash } from 'viem';
import { useWriteContract, usePublicClient } from 'wagmi';
import {
  BTC_ADDRESS,
  BORROWING_VAULT_ADDRESS,
  ERC20_ABI,
  BORROWING_VAULT_ABI,
} from '@/config/contracts';
import {
  BorrowingErrorType,
  type BorrowingError,
  type BorrowingTxHashes,
} from '@/types/domain';

const MAX_RETRIES = 3;
const RETRY_DELAYS = [1000, 2000, 4000]; // Exponential backoff: 1s, 2s, 4s

interface UseBorrowingFlowParams {
  collateralRequired: bigint;
  tipAmount: bigint;
  recipient: Address;
  message?: string;
}

interface UseBorrowingFlowReturn {
  executeFlow: () => Promise<void>;
  currentStep: 1 | 2 | 3 | null;
  completedSteps: number[];
  error: BorrowingError | null;
  isLoading: boolean;
  retry: () => void;
  cancel: () => void;
  txHashes: BorrowingTxHashes;
  retryCount: number;
  positionId: string | null;
}

/**
 * Custom hook for managing the 3-step BTC borrowing flow
 *
 * Steps:
 * 1. Approve BTC collateral
 * 2. Deposit collateral & mint MUSD
 * 3. Execute tip (send MUSD to recipient)
 *
 * Features:
 * - Automatic transaction confirmation waiting
 * - Auto-retry for steps 2 and 3 (up to 3 attempts)
 * - Error parsing and user-friendly messages
 * - Transaction hash tracking for all steps
 */
export function useBorrowingFlow({
  collateralRequired,
  tipAmount,
  recipient,
  message = '',
}: UseBorrowingFlowParams): UseBorrowingFlowReturn {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | null>(null);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [error, setError] = useState<BorrowingError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [txHashes, setTxHashes] = useState<BorrowingTxHashes>({});
  const [retryCount, setRetryCount] = useState(0);
  const [positionId, setPositionId] = useState<string | null>(null);

  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  /**
   * Validate all required contract addresses are configured
   */
  const validateContractAddresses = useCallback(() => {
    if (!BTC_ADDRESS) {
      throw new Error(
        'BTC token address not configured. Set NEXT_PUBLIC_BTC_ADDRESS_TESTNET in environment.'
      );
    }
    if (!BORROWING_VAULT_ADDRESS) {
      throw new Error(
        'BorrowingVault address not configured. Set NEXT_PUBLIC_BORROWING_VAULT_ADDRESS_TESTNET in environment.'
      );
    }
  }, []);

  /**
   * Create a BorrowingError with metadata
   */
  const createError = useCallback(
    (error: Error, step: 1 | 2 | 3, type: BorrowingErrorType): BorrowingError => {
      return {
        ...error,
        type,
        step,
        retryable: type !== BorrowingErrorType.USER_REJECTED,
      } as BorrowingError;
    },
    []
  );

  /**
   * Parse error and determine type
   */
  const parseError = useCallback(
    (error: Error, step: 1 | 2 | 3): BorrowingError => {
      const message = error.message.toLowerCase();

      if (message.includes('user rejected') || message.includes('user denied')) {
        return createError(error, step, BorrowingErrorType.USER_REJECTED);
      }

      if (message.includes('insufficient funds') || message.includes('gas')) {
        return createError(error, step, BorrowingErrorType.INSUFFICIENT_GAS);
      }

      if (message.includes('insufficient balance')) {
        return createError(error, step, BorrowingErrorType.INSUFFICIENT_BALANCE);
      }

      if (
        message.includes('network') ||
        message.includes('rpc') ||
        message.includes('timeout')
      ) {
        return createError(error, step, BorrowingErrorType.NETWORK_ERROR);
      }

      if (message.includes('revert') || message.includes('execution reverted')) {
        return createError(error, step, BorrowingErrorType.CONTRACT_ERROR);
      }

      return createError(error, step, BorrowingErrorType.UNKNOWN_ERROR);
    },
    [createError]
  );

  /**
   * Wait for transaction confirmation on-chain
   */
  const waitForTransaction = useCallback(async (hash: Hash) => {
    if (!publicClient) {
      throw new Error('Public client not available');
    }

    console.log(`[BorrowingFlow] Waiting for transaction ${hash}`);
    const receipt = await publicClient.waitForTransactionReceipt({
      hash,
      confirmations: 1,
    });
    console.log(`[BorrowingFlow] Transaction confirmed:`, receipt.status);
    return receipt;
  }, [publicClient]);

  /**
   * Retry a failed step with exponential backoff
   */
  const retryStep = useCallback(
    async (stepFn: () => Promise<void>, step: 2 | 3) => {
      for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
        try {
          setRetryCount(attempt + 1);
          console.log(`[BorrowingFlow] Retrying step ${step}, attempt ${attempt + 1}/${MAX_RETRIES}`);

          if (attempt > 0) {
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAYS[attempt - 1]));
          }

          await stepFn();
          setRetryCount(0);
          return; // Success
        } catch (err) {
          console.error(`[BorrowingFlow] Step ${step} attempt ${attempt + 1} failed:`, err);

          if (attempt === MAX_RETRIES - 1) {
            throw err; // Max retries exhausted
          }
        }
      }
    },
    []
  );

  /**
   * Step 1: Approve BTC collateral
   */
  const executeStep1 = useCallback(async () => {
    try {
      setCurrentStep(1);
      setIsLoading(true);
      setError(null);

      console.log('[BorrowingFlow] Step 1: Approving BTC collateral', {
        collateralRequired: collateralRequired.toString(),
      });

      if (!BTC_ADDRESS || !BORROWING_VAULT_ADDRESS) {
        throw new Error('Contract addresses not configured');
      }

      // Call approve on BTC token contract
      const hash = await writeContractAsync({
        address: BTC_ADDRESS,
        abi: ERC20_ABI,
        functionName: 'approve',
        args: [BORROWING_VAULT_ADDRESS, collateralRequired],
      });

      setTxHashes((prev) => ({ ...prev, approve: hash }));

      // Wait for confirmation
      await waitForTransaction(hash);

      // Mark step 1 complete
      setCompletedSteps((prev) => [...prev, 1]);
      console.log('[BorrowingFlow] Step 1 complete');
    } catch (err) {
      const error = parseError(err as Error, 1);
      setError(error);
      throw error;
    }
  }, [collateralRequired, writeContractAsync, waitForTransaction, parseError]);

  /**
   * Step 2: Deposit collateral and mint MUSD
   */
  const executeStep2 = useCallback(async () => {
    try {
      setCurrentStep(2);
      setIsLoading(true);
      setError(null);

      console.log('[BorrowingFlow] Step 2: Depositing collateral and minting MUSD', {
        collateralRequired: collateralRequired.toString(),
        tipAmount: tipAmount.toString(),
      });

      if (!BORROWING_VAULT_ADDRESS) {
        throw new Error('BorrowingVault address not configured');
      }

      // Call depositCollateral on BorrowingVault
      const hash = await writeContractAsync({
        address: BORROWING_VAULT_ADDRESS,
        abi: BORROWING_VAULT_ABI,
        functionName: 'depositCollateral',
        args: [collateralRequired, tipAmount],
      });

      setTxHashes((prev) => ({ ...prev, deposit: hash }));

      // Wait for confirmation and get receipt
      const receipt = await waitForTransaction(hash);

      // Extract position ID from transaction receipt
      // The depositCollateral function returns positionId as the first output
      // In the receipt, we can extract it from the transaction data or logs
      // For simplicity, we'll extract it from the return value
      let extractedPositionId: string;

      if (receipt.logs && receipt.logs.length > 0) {
        // Try to extract from logs (PositionCreated event would contain the ID)
        // For now, we'll use a simpler approach: the return value from the contract
        // Since viem doesn't easily expose return values from receipts, we'll need to
        // decode the logs or use a different approach

        // TODO: Once contract is deployed, update this to parse the actual event
        // For testnet/development, use a deterministic value based on transaction
        extractedPositionId = BigInt(receipt.blockNumber).toString();
        console.log('[BorrowingFlow] Extracted position ID from block number:', extractedPositionId);
      } else {
        // Fallback: use block number as position ID
        extractedPositionId = BigInt(receipt.blockNumber).toString();
        console.log('[BorrowingFlow] Using block number as position ID:', extractedPositionId);
      }

      setPositionId(extractedPositionId);

      // Mark step 2 complete
      setCompletedSteps((prev) => [...prev, 2]);
      console.log('[BorrowingFlow] Step 2 complete, positionId:', extractedPositionId);
    } catch (err) {
      const error = parseError(err as Error, 2);
      setError(error);
      throw error;
    }
  }, [collateralRequired, tipAmount, writeContractAsync, waitForTransaction, parseError]);

  /**
   * Step 3: Execute tip
   */
  const executeStep3 = useCallback(async () => {
    try {
      setCurrentStep(3);
      setIsLoading(true);
      setError(null);

      if (!positionId) {
        throw new Error('Position ID not found. Please complete step 2 first.');
      }

      // Validate position ID is a valid numeric value
      try {
        const positionIdBigInt = BigInt(positionId);
        if (positionIdBigInt < BigInt(0)) {
          throw new Error('Invalid position ID: must be non-negative');
        }
      } catch {
        throw new Error(`Invalid position ID format: ${positionId}`);
      }

      console.log('[BorrowingFlow] Step 3: Executing tip', {
        positionId,
        recipient,
        message,
      });

      if (!BORROWING_VAULT_ADDRESS) {
        throw new Error('BorrowingVault address not configured');
      }

      // Call executeTip on BorrowingVault
      const hash = await writeContractAsync({
        address: BORROWING_VAULT_ADDRESS,
        abi: BORROWING_VAULT_ABI,
        functionName: 'executeTip',
        args: [BigInt(positionId), recipient, message],
      });

      setTxHashes((prev) => ({ ...prev, execute: hash }));

      // Wait for confirmation
      await waitForTransaction(hash);

      // Mark step 3 complete
      setCompletedSteps((prev) => [...prev, 3]);
      console.log('[BorrowingFlow] Step 3 complete, flow finished');
    } catch (err) {
      const error = parseError(err as Error, 3);
      setError(error);
      throw error;
    }
  }, [positionId, recipient, message, writeContractAsync, waitForTransaction, parseError]);

  /**
   * Execute the full borrowing flow
   */
  const executeFlow = useCallback(async () => {
    try {
      // Validate contract addresses before starting
      validateContractAddresses();

      setIsLoading(true);
      setError(null);
      setCompletedSteps([]);
      setRetryCount(0);

      console.log('[BorrowingFlow] Starting borrowing flow');

      // Step 1: Approve (no auto-retry)
      await executeStep1();

      // Step 2: Deposit (with auto-retry)
      await retryStep(executeStep2, 2);

      // Step 3: Execute tip (with auto-retry)
      await retryStep(executeStep3, 3);

      setIsLoading(false);
      setCurrentStep(null);
      console.log('[BorrowingFlow] Flow complete');
    } catch (err) {
      setIsLoading(false);
      console.error('[BorrowingFlow] Flow failed:', err);
      // Error already set in individual step functions
    }
  }, [validateContractAddresses, executeStep1, executeStep2, executeStep3, retryStep]);

  /**
   * Retry the current failed step
   */
  const retry = useCallback(() => {
    if (!error) return;

    console.log(`[BorrowingFlow] Manual retry requested for step ${error.step}`);
    setError(null);
    setRetryCount(0);

    switch (error.step) {
      case 1:
        executeStep1();
        break;
      case 2:
        retryStep(executeStep2, 2);
        break;
      case 3:
        retryStep(executeStep3, 3);
        break;
    }
  }, [error, executeStep1, executeStep2, executeStep3, retryStep]);

  /**
   * Cancel the borrowing flow
   */
  const cancel = useCallback(() => {
    console.log('[BorrowingFlow] Flow cancelled by user');
    setIsLoading(false);
    setCurrentStep(null);
    setError(null);
  }, []);

  return {
    executeFlow,
    currentStep,
    completedSteps,
    error,
    isLoading,
    retry,
    cancel,
    txHashes,
    retryCount,
    positionId,
  };
}
