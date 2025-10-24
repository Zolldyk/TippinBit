'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Wallet } from 'lucide-react';
import { modalVariants, backdropVariants, useReducedMotion } from '@/lib/animations';

export interface WalletInstallModalProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * WalletInstallModal component for prompting users to install a Web3 wallet.
 * Displays installation instructions and links to popular wallet download pages.
 *
 * @param isOpen - Whether the modal is visible
 * @param onClose - Callback to close the modal
 *
 * @example
 * <WalletInstallModal isOpen={showModal} onClose={() => setShowModal(false)} />
 */
export function WalletInstallModal({ isOpen, onClose }: WalletInstallModalProps) {
  const [isMobile, setIsMobile] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    // Detect mobile devices
    if (typeof window !== 'undefined') {
      setIsMobile(/iPhone|iPad|iPod|Android/i.test(navigator.userAgent));
    }
  }, []);

  useEffect(() => {
    // Prevent body scroll when modal is open
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const wallets = [
    {
      name: 'MetaMask',
      url: 'https://metamask.io/download/',
      description: 'Most popular Ethereum wallet',
    },
    {
      name: 'Coinbase Wallet',
      url: 'https://www.coinbase.com/wallet/downloads',
      description: 'Secure crypto wallet by Coinbase',
    },
    {
      name: 'Rainbow',
      url: 'https://rainbow.me/download',
      description: 'User-friendly Ethereum wallet',
    },
  ];

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
              aria-labelledby="wallet-install-title"
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
                  <div className="p-3 bg-blue-500/10 rounded-lg">
                    <Wallet className="h-6 w-6 text-blue-400" />
                  </div>
                  <h2 id="wallet-install-title" className="text-xl font-bold text-neutral-100">
                    Install a wallet to continue
                  </h2>
                </div>

                <p className="text-sm text-neutral-300 mb-6">
                  TippinBit requires a Web3 wallet to send tips securely. Choose one below to get started:
                </p>

                {isMobile ? (
                  <div className="mb-6 p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
                    <p className="text-sm text-blue-200 mb-2">
                      On mobile? Install a wallet app from your app store:
                    </p>
                    <ul className="text-sm text-neutral-300 space-y-1">
                      <li>• MetaMask (iOS & Android)</li>
                      <li>• Coinbase Wallet (iOS & Android)</li>
                      <li>• Rainbow (iOS & Android)</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-3 mb-6">
                    {wallets.map((wallet) => (
                      <a
                        key={wallet.name}
                        href={wallet.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block p-4 bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors border border-neutral-700 hover:border-neutral-600"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h3 className="text-sm font-medium text-neutral-100">{wallet.name}</h3>
                            <p className="text-xs text-neutral-400 mt-1">{wallet.description}</p>
                          </div>
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                            strokeWidth={1.5}
                            stroke="currentColor"
                            className="w-5 h-5 text-neutral-400"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25"
                            />
                          </svg>
                        </div>
                      </a>
                    ))}
                  </div>
                )}

                <div className="p-4 bg-neutral-800/50 border border-neutral-700 rounded-lg">
                  <p className="text-xs text-neutral-400">
                    After installing, refresh this page and click &ldquo;Connect wallet&rdquo; to get started.
                  </p>
                </div>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
