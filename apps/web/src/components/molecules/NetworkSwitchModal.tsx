'use client';

import { motion, AnimatePresence } from 'motion/react';
import { X, Network } from 'lucide-react';
import { mezoTestnet } from '@/config/chains';
import { modalVariants, backdropVariants, useReducedMotion } from '@/lib/animations';

export interface NetworkSwitchModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddNetwork?: () => void;
}

/**
 * NetworkSwitchModal component for displaying manual network switch instructions.
 * Shows when automatic network switching fails or is rejected by the user.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback to close the modal
 * @param onAddNetwork - Optional callback to trigger adding Mezo testnet to wallet
 *
 * @example
 * <NetworkSwitchModal
 *   isOpen={showModal}
 *   onClose={() => setShowModal(false)}
 *   onAddNetwork={handleAddNetwork}
 * />
 */
export function NetworkSwitchModal({
  isOpen,
  onClose,
  onAddNetwork,
}: NetworkSwitchModalProps) {
  const shouldReduceMotion = useReducedMotion();
  const rpcUrl = process.env['NEXT_PUBLIC_SPECTRUM_RPC_URL'] || 'https://rpc.test.mezo.org';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop with fade animation (AC 4, 14) */}
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            {...(!shouldReduceMotion && { variants: backdropVariants })}
            initial="hidden"
            animate="visible"
            exit="exit"
            onClick={onClose}
          />

          {/* Modal content with slide-up + scale animation (AC 4, 5, 14) */}
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none"
            {...(!shouldReduceMotion && { variants: modalVariants })}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div
              className="relative w-full max-w-md mx-4 bg-neutral-900 rounded-xl shadow-xl border border-neutral-800 pointer-events-auto"
              role="dialog"
              aria-modal="true"
              aria-labelledby="network-switch-title"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Close button */}
              <button
                onClick={onClose}
                className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-100 transition-colors rounded-lg hover:bg-neutral-800"
                aria-label="Close modal"
              >
                <X className="h-5 w-5" />
              </button>

              {/* Content */}
              <div className="p-6">
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-3 bg-amber-500/10 rounded-lg">
                    <Network className="h-6 w-6 text-amber-400" />
                  </div>
                  <h2 id="network-switch-title" className="text-xl font-bold text-neutral-100">
                    Switch to Mezo Testnet
                  </h2>
                </div>

                <p className="text-sm text-neutral-300 mb-6">
                  TippinBit requires the Mezo testnet. Please switch to Mezo testnet in your wallet settings.
                </p>

                {onAddNetwork && (
                  <div className="mb-6">
                    <button
                      onClick={onAddNetwork}
                      className="w-full p-4 bg-amber-500 hover:bg-amber-600 text-white rounded-lg transition-colors font-medium"
                    >
                      Add Mezo testnet to wallet
                    </button>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="p-4 bg-neutral-800 rounded-lg border border-neutral-700">
                    <h3 className="text-sm font-medium text-neutral-200 mb-3">
                      Manual Setup Instructions:
                    </h3>
                    <div className="space-y-2 text-xs text-neutral-400">
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Network Name:</span>
                        <span className="text-neutral-200 font-mono">{mezoTestnet.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Chain ID:</span>
                        <span className="text-neutral-200 font-mono">{mezoTestnet.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-neutral-500">Currency:</span>
                        <span className="text-neutral-200 font-mono">
                          {mezoTestnet.nativeCurrency.symbol}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-neutral-500">RPC URL:</span>
                        <span className="text-neutral-200 font-mono break-all text-[10px]">
                          {rpcUrl}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1">
                        <span className="text-neutral-500">Explorer:</span>
                        <a
                          href={mezoTestnet.blockExplorers.default.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300 font-mono break-all text-[10px] underline"
                        >
                          {mezoTestnet.blockExplorers.default.url}
                        </a>
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-xs text-blue-200">
                      💡 Copy these details into your wallet&apos;s &ldquo;Add Network&rdquo; settings to manually add Mezo testnet.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
