'use client';

import { useEffect, useState, useCallback } from 'react';
import { type Address } from 'viem';
import * as Dialog from '@radix-ui/react-dialog';
import { X, AlertTriangle } from 'lucide-react';
import { TransactionStepper } from '@/components/molecules/TransactionStepper';
import { TransactionError } from '@/components/molecules/TransactionError';
import { Spinner } from '@/components/atoms/Spinner';
import { Button } from '@/components/atoms/Button';
import { useBorrowingFlow } from '@/hooks/useBorrowingFlow';
import { type StepConfig } from '@/types/domain';

const STEPS: StepConfig[] = [
  { label: 'Step 1: Approve collateral', estimatedTime: '~15 seconds' },
  { label: 'Step 2: Mint MUSD', estimatedTime: '~20 seconds' },
  { label: 'Step 3: Send to creator', estimatedTime: '~15 seconds' },
];

interface BorrowingFlowModalProps {
  isOpen: boolean;
  onClose: () => void;
  tipAmount: bigint;
  recipient: Address;
  btcPrice: bigint; // Passed from parent for consistency
  collateralRequired: bigint;
  message?: string;
  onComplete: (txHash: string) => void;
}

/**
 * BorrowingFlowModal component
 *
 * Modal that displays and manages the 3-step BTC borrowing transaction flow.
 * Shows progress stepper, loading states, error handling, and confirmation dialogs.
 */
export function BorrowingFlowModal({
  isOpen,
  onClose,
  tipAmount,
  recipient,
  // btcPrice is passed for consistency but not used in modal (future use: slippage protection)
  btcPrice,
  collateralRequired,
  message = '',
  onComplete,
}: BorrowingFlowModalProps) {
  // Suppress unused variable warning - btcPrice will be used for slippage protection in Story 2.5
  void btcPrice;
  const {
    executeFlow,
    currentStep,
    completedSteps,
    error,
    isLoading,
    retry,
    cancel,
    txHashes,
    retryCount,
  } = useBorrowingFlow({
    collateralRequired,
    tipAmount,
    recipient,
    message,
  });

  const [showCancelWarning, setShowCancelWarning] = useState(false);

  // Auto-start flow when modal opens
  useEffect(() => {
    if (isOpen && currentStep === null && completedSteps.length === 0) {
      executeFlow();
    }
  }, [isOpen, currentStep, completedSteps.length, executeFlow]);

  // Redirect to confirmation page when flow completes
  useEffect(() => {
    if (completedSteps.length === 3 && txHashes.execute) {
      console.log('[BorrowingFlowModal] Flow complete, redirecting...');
      onComplete(txHashes.execute);
      onClose();
    }
  }, [completedSteps, txHashes.execute, onComplete, onClose]);

  const handleCancel = () => {
    // Show warning if any steps completed
    if (completedSteps.length > 0) {
      setShowCancelWarning(true);
    } else {
      cancel();
      onClose();
    }
  };

  const handleConfirmCancel = () => {
    cancel();
    setShowCancelWarning(false);
    onClose();
  };

  const getStatusMessage = useCallback((): string => {
    if (error) {
      return ''; // Error message handled by TransactionError component
    }

    if (retryCount > 0) {
      return `Retrying... (Attempt ${retryCount} of 3)`;
    }

    switch (currentStep) {
      case 1:
        return 'Approving BTC collateral...';
      case 2:
        return 'Minting MUSD from collateral...';
      case 3:
        return 'Sending MUSD to creator...';
      default:
        return 'Preparing transaction...';
    }
  }, [error, retryCount, currentStep]);

  return (
    <>
      <Dialog.Root open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <Dialog.Title className="text-xl font-bold text-gray-900">
                Borrowing BTC for Tip
              </Dialog.Title>
              <Dialog.Close asChild>
                <button
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                  aria-label="Close"
                  disabled={isLoading && !error}
                >
                  <X size={24} />
                </button>
              </Dialog.Close>
            </div>

            <Dialog.Description className="sr-only">
              Multi-step transaction flow for borrowing BTC and sending a tip
            </Dialog.Description>

            {/* Progress Stepper */}
            <div className="mb-8">
              <TransactionStepper
                currentStep={currentStep || 1}
                completedSteps={completedSteps}
                steps={STEPS}
              />
            </div>

            {/* Status Message / Error */}
            <div className="mb-6">
              {error ? (
                <TransactionError
                  error={error}
                  step={error.step}
                  onRetry={retry}
                  onCancel={handleCancel}
                />
              ) : (
                <div className="flex items-center justify-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <Spinner size={20} color="#FF6B6B" />
                  <p className="text-sm text-gray-700">{getStatusMessage()}</p>
                </div>
              )}
            </div>

            {/* Transaction Details */}
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Tip Amount:</span>
                <span className="font-medium text-gray-900">
                  ${(Number(tipAmount) / 1e18).toFixed(2)} MUSD
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Collateral Required:</span>
                <span className="font-medium text-gray-900">
                  {(Number(collateralRequired) / 1e18).toFixed(6)} BTC
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Recipient:</span>
                <span className="font-medium text-gray-900 font-mono text-xs">
                  {recipient.slice(0, 6)}...{recipient.slice(-4)}
                </span>
              </div>
            </div>

            {/* Cancel Button (only if not in error state) */}
            {!error && (
              <div className="mt-6 flex justify-center">
                <Button
                  onClick={handleCancel}
                  variant="secondary"
                  disabled={isLoading}
                  className="text-sm px-6 py-2"
                >
                  Cancel
                </Button>
              </div>
            )}
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>

      {/* Cancel Warning Dialog */}
      <Dialog.Root open={showCancelWarning} onOpenChange={setShowCancelWarning}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 bg-black/50 data-[state=open]:animate-fade-in" />
          <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-xl shadow-xl p-6 w-full max-w-md">
            <div className="flex items-start gap-3 mb-4">
              <AlertTriangle className="text-amber-600 flex-shrink-0" size={24} />
              <div>
                <Dialog.Title className="text-lg font-bold text-gray-900 mb-2">
                  Warning: Previous Steps Cannot Be Reversed
                </Dialog.Title>
                <Dialog.Description className="text-sm text-gray-700 space-y-2">
                  <p>
                    Step {completedSteps[completedSteps.length - 1]} is complete and
                    your BTC collateral may be locked.
                  </p>
                  <p>If you cancel now:</p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Your collateral will remain locked</li>
                    <li>You can complete the flow later using your position ID</li>
                    <li>Or you can close your position manually</li>
                  </ul>
                  <p className="font-medium mt-3">Are you sure you want to cancel?</p>
                </Dialog.Description>
              </div>
            </div>

            <div className="flex gap-3 justify-end">
              <Button
                onClick={() => setShowCancelWarning(false)}
                variant="secondary"
                className="text-sm px-4 py-2"
              >
                Go Back
              </Button>
              <Button
                onClick={handleConfirmCancel}
                className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2"
              >
                Yes, Cancel
              </Button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </>
  );
}
