import { type Hash } from 'viem';

/**
 * Transaction hash type
 */
export type TxHash = Hash;

/**
 * Borrowing flow state
 *
 * Uses discriminated union for type-safe state management across all
 * steps of the BTC borrowing flow (approve → deposit → execute).
 */
export type BorrowingState =
  | { status: 'idle' }
  | { status: 'step1_preparing' }
  | { status: 'step1_confirming'; txHash: TxHash }
  | {
      status: 'step1_complete';
      txHash: TxHash;
      positionId?: string;
      priceTimestamp?: number;
    }
  | { status: 'step2_preparing' }
  | { status: 'step2_confirming'; txHash: TxHash }
  | { status: 'step2_complete'; txHash: TxHash; positionId: string }
  | { status: 'step3_preparing' }
  | { status: 'step3_confirming'; txHash: TxHash }
  | { status: 'complete'; txHash: TxHash; timestamp: number }
  | { status: 'error'; error: Error; step: 1 | 2 | 3 };

/**
 * Borrowing error types
 */
export enum BorrowingErrorType {
  USER_REJECTED = 'USER_REJECTED', // User cancelled wallet prompt
  INSUFFICIENT_GAS = 'INSUFFICIENT_GAS', // Not enough ETH for gas
  INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE', // Not enough BTC
  NETWORK_ERROR = 'NETWORK_ERROR', // RPC error
  CONTRACT_ERROR = 'CONTRACT_ERROR', // Contract revert
  UNKNOWN_ERROR = 'UNKNOWN_ERROR',
}

/**
 * Borrowing error interface
 */
export interface BorrowingError extends Error {
  type: BorrowingErrorType;
  step: 1 | 2 | 3;
  retryable: boolean;
}

/**
 * Step configuration for transaction stepper
 */
export interface StepConfig {
  label: string;
  estimatedTime: string; // e.g., "~15 seconds"
}

/**
 * Transaction hashes for all borrowing flow steps
 */
export interface BorrowingTxHashes {
  approve?: TxHash;
  deposit?: TxHash;
  execute?: TxHash;
}
