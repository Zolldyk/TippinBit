/**
 * Explainer panel for BTC borrowing flow
 * Educates users about collateral-based borrowing before they proceed
 *
 * Features:
 * - Desktop: Centered modal dialog
 * - Mobile: Bottom sheet with swipe-down gesture
 * - Animated entry/exit
 * - Conversational language (no crypto jargon)
 * - Dynamic collateral calculation with real-time price feeds
 * - Insufficient balance detection and "reduce tip" helper
 * - Price staleness warning with manual refresh
 *
 * @example
 * ```tsx
 * <BorrowingExplainerPanel
 *   isOpen={showExplainer}
 *   onClose={() => setShowExplainer(false)}
 *   onContinue={handleStartBorrowing}
 *   tipAmount="5.00"
 *   onReduceTip={(newAmount) => setTipAmount(formatUnits(newAmount, 18))}
 * />
 * ```
 */

'use client';

import { useCallback, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bitcoin,
  Lock,
  DollarSign,
  ArrowRight,
  User,
  X,
  AlertCircle,
  AlertTriangle,
  RefreshCw,
  Loader2,
} from 'lucide-react';
import { parseEther } from 'viem';
import { Button } from '../atoms/Button';
import {
  formatBtcAmount,
  formatUsdAmount,
  calculateCollateralRequired,
  calculateMaxTipFromCollateral,
} from '@/lib/btc-calculations';
import { formatTimeAgo } from '@/lib/formatting';
import { useAccount } from 'wagmi';
import { useBTCPrice } from '@/hooks/useBTCPrice';
import { useBTCBalance } from '@/hooks/useBTCBalance';

export interface BorrowingExplainerPanelProps {
  /** Whether the panel is open */
  isOpen: boolean;
  /** Callback when panel is closed */
  onClose: () => void;
  /** Callback when user clicks Continue */
  onContinue: () => void;
  /** Tip amount in MUSD (string for display, e.g., "5.00") */
  tipAmount: string;
  /** Optional callback when user clicks "Reduce Tip" button */
  onReduceTip?: (newAmount: bigint) => void;
}

export function BorrowingExplainerPanel({
  isOpen,
  onClose,
  onContinue,
  tipAmount,
  onReduceTip,
}: BorrowingExplainerPanelProps) {
  // Get connected wallet address
  const { address: walletAddress } = useAccount();

  // Fetch real-time BTC price
  const {
    btcPrice,
    isStale,
    isFetching,
    isError,
    error,
    refetch,
    timestamp,
  } = useBTCPrice();

  // Get user's BTC balance
  const { btcBalance } = useBTCBalance({
    address: walletAddress,
  });

  // Parse tip amount from string to bigint
  const tipAmountWei = useMemo(() => {
    try {
      return parseEther(tipAmount || '0');
    } catch {
      return BigInt(0);
    }
  }, [tipAmount]);

  // Calculate required collateral when price or amount changes
  const collateralRequired = useMemo(() => {
    if (!btcPrice) return null;
    return calculateCollateralRequired(tipAmountWei, btcPrice);
  }, [tipAmountWei, btcPrice]);

  // Calculate max tip for "reduce tip" helper
  const maxTip = useMemo(() => {
    if (!btcPrice || !btcBalance) return null;
    return calculateMaxTipFromCollateral(btcBalance, btcPrice);
  }, [btcBalance, btcPrice]);

  // Calculate USD value of collateral
  const collateralUsd = useMemo(() => {
    if (!collateralRequired || !btcPrice) return null;
    return (collateralRequired * btcPrice) / BigInt(1e18);
  }, [collateralRequired, btcPrice]);

  // Check for insufficient balance
  const insufficientBalance =
    btcBalance && collateralRequired ? btcBalance < collateralRequired : false;

  // Handle swipe-down gesture on mobile
  const handleDragEnd = useCallback(
    (_event: unknown, info: { offset: { y: number } }) => {
      if (info.offset.y > 100) {
        onClose();
      }
    },
    [onClose]
  );

  // Handle "Use MUSD instead" button in error state
  const handleUseMusd = useCallback(() => {
    onClose();
  }, [onClose]);

  // Loading state
  if (isFetching && !btcPrice) {
    return (
      <AnimatePresence>
        {isOpen && (
          <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
              <Dialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 bg-black/50 z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[400px] z-50 text-center"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--color-coral)] mx-auto mb-4" />
                  <p className="text-[var(--color-neutral-700)]">
                    Fetching BTC price...
                  </p>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </AnimatePresence>
    );
  }

  // Error state
  if (isError || !btcPrice) {
    return (
      <AnimatePresence>
        {isOpen && (
          <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
            <Dialog.Portal>
              <Dialog.Overlay asChild>
                <motion.div
                  className="fixed inset-0 bg-black/50 z-40"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                />
              </Dialog.Overlay>
              <Dialog.Content asChild>
                <motion.div
                  className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[400px] z-50"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  <Dialog.Close asChild>
                    <button
                      className="absolute top-4 right-4 text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)] transition-colors"
                      aria-label="Close"
                    >
                      <X className="h-5 w-5" />
                    </button>
                  </Dialog.Close>

                  <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
                  <Dialog.Title asChild>
                    <h2 className="text-xl font-bold text-[var(--color-neutral-900)] mb-2 text-center">
                      Unable to fetch BTC price
                    </h2>
                  </Dialog.Title>
                  <Dialog.Description asChild>
                    <p className="text-[var(--color-neutral-600)] text-sm text-center mb-6">
                      {error?.message || 'Try again or use MUSD flow.'}
                    </p>
                  </Dialog.Description>

                  <div className="flex flex-col gap-3">
                    <Button
                      variant="primary"
                      onClick={() => refetch()}
                      className="w-full"
                    >
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Retry
                    </Button>
                    <Button
                      variant="secondary"
                      onClick={handleUseMusd}
                      className="w-full"
                    >
                      Use MUSD instead
                    </Button>
                  </div>
                </motion.div>
              </Dialog.Content>
            </Dialog.Portal>
          </Dialog.Root>
        )}
      </AnimatePresence>
    );
  }

  // Content shared between desktop and mobile
  const content = (
    <>
      {/* Headline */}
      <Dialog.Title asChild>
        <h2 className="text-2xl sm:text-3xl font-bold text-[var(--color-coral)] mb-4 text-center sm:text-left">
          Support without selling your Bitcoin
        </h2>
      </Dialog.Title>

      {/* Body copy - conversational tone */}
      <Dialog.Description asChild>
        <div className="text-[var(--color-neutral-700)] text-base mb-6 space-y-2 text-center sm:text-left">
          <p>
            Lock your BTC as collateral, mint MUSD, and tip the creator. You keep your
            BTC and can reclaim it anytime by repaying the borrowed amount.
          </p>
        </div>
      </Dialog.Description>

      {/* Price staleness warning */}
      {isStale && timestamp && (
        <div className="bg-amber-50 border-l-4 border-amber-400 p-3 mb-4 rounded">
          <div className="flex items-start gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-amber-800 text-sm">
                BTC price may be outdated (last updated {formatTimeAgo(timestamp)})
              </p>
            </div>
            <button
              onClick={() => refetch()}
              className="text-amber-600 hover:text-amber-700 transition-colors flex-shrink-0"
              aria-label="Refresh price"
              disabled={isFetching}
            >
              <RefreshCw className={`h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>
      )}

      {/* Visual diagram */}
      <div className="flex items-center justify-center gap-3 sm:gap-4 mb-8 flex-wrap sm:flex-nowrap">
        <div className="flex flex-col items-center gap-2">
          <Bitcoin className="h-12 w-12 text-amber-400" />
          <span className="text-xs font-medium text-[var(--color-neutral-600)]">BTC</span>
        </div>
        <ArrowRight className="h-5 w-5 text-[var(--color-neutral-400)]" />
        <div className="flex flex-col items-center gap-2">
          <Lock className="h-12 w-12 text-[var(--color-neutral-500)]" />
          <span className="text-xs font-medium text-[var(--color-neutral-600)]">Collateral</span>
        </div>
        <ArrowRight className="h-5 w-5 text-[var(--color-neutral-400)]" />
        <div className="flex flex-col items-center gap-2">
          <DollarSign className="h-12 w-12 text-[var(--color-teal)]" />
          <span className="text-xs font-medium text-[var(--color-neutral-600)]">MUSD</span>
        </div>
        <ArrowRight className="h-5 w-5 text-[var(--color-neutral-400)]" />
        <div className="flex flex-col items-center gap-2">
          <User className="h-12 w-12 text-[var(--color-coral)]" />
          <span className="text-xs font-medium text-[var(--color-neutral-600)]">Creator</span>
        </div>
      </div>

      {/* Collateral calculation */}
      {collateralRequired !== null && collateralUsd !== null && (
        <div className="bg-[var(--color-neutral-100)] rounded-lg p-4 mb-2">
          <p className="text-sm text-[var(--color-neutral-700)]">
            <span className="font-semibold">
              Requires {formatBtcAmount(collateralRequired)} BTC
            </span>{' '}
            <span className="text-[var(--color-neutral-500)]">
              (~${formatUsdAmount(collateralUsd)} at current rate)
            </span>
          </p>
          <p className="text-xs text-[var(--color-neutral-500)] mt-1">
            Safe 215% collateral ratio
          </p>
        </div>
      )}

      {/* Insufficient balance warning */}
      {insufficientBalance && btcBalance !== null && collateralRequired !== null && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 mb-4 rounded">
          <div className="flex items-start gap-2">
            <AlertCircle className="h-4 w-4 text-red-600 mt-0.5 flex-shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-red-800 text-sm font-semibold mb-1">
                You have {formatBtcAmount(btcBalance)} BTC. Need{' '}
                {formatBtcAmount(collateralRequired)} BTC.
              </p>
              <p className="text-red-700 text-sm mb-2">
                Reduce tip amount or use MUSD instead.
              </p>
              {maxTip && onReduceTip && (
                <button
                  onClick={() => onReduceTip(maxTip)}
                  className="px-3 py-1 bg-white border-2 border-amber-400 text-amber-700 rounded-lg text-sm font-medium hover:bg-amber-50 transition-colors"
                >
                  Send your max: ${formatUsdAmount(maxTip)} (
                  {formatBtcAmount(btcBalance)} BTC collateral)
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Borrowing rate */}
      <p className="text-xs text-[var(--color-neutral-500)] mb-6 text-center sm:text-left opacity-70">
        1% borrowing rate via Mezo
      </p>

      {/* Action buttons */}
      <div className="flex gap-3 justify-end flex-col sm:flex-row">
        <Button
          variant="secondary"
          onClick={onClose}
          className="w-full sm:w-auto order-2 sm:order-1"
        >
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={onContinue}
          disabled={insufficientBalance}
          className="w-full sm:w-auto order-1 sm:order-2"
        >
          Continue
        </Button>
      </div>
    </>
  );

  return (
    <AnimatePresence>
      {isOpen && (
        <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
          <Dialog.Portal>
            {/* Backdrop - fade in */}
            <Dialog.Overlay asChild>
              <motion.div
                className="fixed inset-0 bg-black/50 z-40"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
              />
            </Dialog.Overlay>

            {/* Desktop Modal - centered with scale animation */}
            <Dialog.Content asChild>
              <motion.div
                className="hidden sm:block fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white rounded-2xl shadow-2xl p-8 w-full max-w-[600px] z-50"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.2 }}
              >
                {/* X close button */}
                <Dialog.Close asChild>
                  <button
                    className="absolute top-4 right-4 text-[var(--color-neutral-400)] hover:text-[var(--color-neutral-600)] transition-colors"
                    aria-label="Close"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </Dialog.Close>

                {content}
              </motion.div>
            </Dialog.Content>

            {/* Mobile Bottom Sheet - slide up */}
            <Dialog.Content asChild>
              <motion.div
                className="block sm:hidden fixed bottom-0 left-0 right-0 bg-white rounded-t-3xl shadow-2xl p-6 z-50"
                initial={{ y: '100%' }}
                animate={{ y: 0 }}
                exit={{ y: '100%' }}
                transition={{ duration: 0.3, ease: 'easeOut' }}
                drag="y"
                dragConstraints={{ top: 0, bottom: 0 }}
                dragElastic={0.2}
                onDragEnd={handleDragEnd}
              >
                {/* Drag handle */}
                <div className="w-12 h-1 bg-[var(--color-neutral-300)] rounded-full mx-auto mb-6" />

                {content}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        </Dialog.Root>
      )}
    </AnimatePresence>
  );
}
