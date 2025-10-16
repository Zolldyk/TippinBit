'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { AlertCircle, Copy, ExternalLink } from 'lucide-react';

/**
 * TransactionErrorPage displays friendly error messages when a transaction fails.
 *
 * Features:
 * - Empathetic error messaging
 * - Transaction hash display with copy functionality
 * - Mezo testnet explorer link
 * - "Try again" button to return to payment page
 * - Help section with relevant resources
 *
 * URL: /error?tx=0x...&message=Error+message
 */
function TransactionErrorContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const txHash = searchParams.get('tx');
  const errorMessage = searchParams.get('message');

  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Trigger fade-in animation
  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  // Handle copy transaction hash
  const handleCopyTxHash = async () => {
    if (txHash) {
      await navigator.clipboard.writeText(txHash);
      setShowCopiedToast(true);
      setTimeout(() => setShowCopiedToast(false), 2000);
    }
  };

  // Handle try again
  const handleTryAgain = () => {
    router.back();
  };

  // Build explorer link
  const explorerLink = txHash ? `https://explorer.test.mezo.org/tx/${txHash}` : null;

  // Truncate hash helper
  const truncateHash = (hash: string) => {
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  // Determine if this is an insufficient funds error
  const isInsufficientFunds =
    errorMessage?.toLowerCase().includes('insufficient') ||
    errorMessage?.toLowerCase().includes('balance');

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div
        className={`w-full max-w-2xl transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Error icon */}
        <div className="mb-6 text-center">
          <AlertCircle
            className="mx-auto h-16 w-16 text-amber-600 sm:h-20 sm:w-20"
            aria-label="Error icon"
          />
        </div>

        {/* Headline */}
        <h1 className="mb-4 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          We know this is frustrating. Here&apos;s what happened...
        </h1>

        {/* Error message card */}
        <div className="mb-6 rounded-lg border border-amber-200 bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-amber-100 pb-4">
            <h2 className="text-sm font-medium text-amber-800">What went wrong</h2>
          </div>

          <p className="text-sm text-slate-700">
            {errorMessage || 'Transaction failed. Your funds are safe.'}
          </p>

          {txHash && (
            <div className="mt-4 rounded-md bg-slate-50 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="mb-1 text-xs font-medium text-slate-500">
                    Transaction ID
                  </p>
                  <code className="text-xs font-mono text-slate-700">
                    {truncateHash(txHash)}
                  </code>
                </div>
                <button
                  onClick={handleCopyTxHash}
                  className="rounded-md border border-slate-300 p-2 hover:bg-slate-100"
                  aria-label="Copy transaction hash"
                >
                  <Copy className="h-4 w-4 text-slate-600" />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Try again button */}
        <div className="mb-6">
          <button
            onClick={handleTryAgain}
            className="w-full rounded-lg bg-coral-500 py-3 text-center text-base font-medium text-white hover:bg-coral-600"
          >
            Try again
          </button>
        </div>

        {/* Help section */}
        <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="mb-3 text-sm font-medium text-slate-900">Need help?</h2>

          <div className="space-y-3 text-sm text-slate-600">
            {isInsufficientFunds && (
              <div>
                <p className="mb-2 font-medium text-slate-700">
                  Get testnet MUSD
                </p>
                <a
                  href="https://faucet.test.mezo.org"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700"
                >
                  Visit Mezo testnet faucet
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            {explorerLink && (
              <div>
                <p className="mb-2 font-medium text-slate-700">
                  Check transaction on blockchain
                </p>
                <a
                  href={explorerLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-teal-600 hover:text-teal-700"
                >
                  View on Mezo Explorer
                  <ExternalLink className="h-3 w-3" />
                </a>
              </div>
            )}

            <div>
              <p className="mb-2 font-medium text-slate-700">
                Still stuck?
              </p>
              <p className="text-xs text-slate-500">
                Contact support or check the documentation for more information.
              </p>
            </div>
          </div>
        </div>

        {/* Copied toast */}
        {showCopiedToast && (
          <div
            className="fixed bottom-4 right-4 rounded-md bg-slate-900 px-4 py-2 text-sm text-white shadow-lg"
            role="status"
            aria-live="polite"
          >
            Copied!
          </div>
        )}
      </div>
    </main>
  );
}

export default function TransactionErrorPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
          <div className="text-sm text-slate-600">Loading...</div>
        </main>
      }
    >
      <TransactionErrorContent />
    </Suspense>
  );
}
