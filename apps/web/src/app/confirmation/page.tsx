'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { CheckCircle2, Copy, ExternalLink, ChevronDown, ChevronUp } from 'lucide-react';
import { validateTxHash } from '@/lib/error-parser';

/**
 * TransactionConfirmationPage displays success message after a tip is sent.
 *
 * Features:
 * - Success checkmark animation
 * - Transaction summary (amount, recipient, timestamp)
 * - Blockchain explorer link (collapsible)
 * - Copy transaction hash functionality
 * - Shareable via direct URL
 *
 * URL: /confirmation?tx=0x...
 */
function TransactionConfirmationContent() {
  const searchParams = useSearchParams();
  const txHash = searchParams.get('tx');

  const [showExplorerDetails, setShowExplorerDetails] = useState(false);
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  // Validate transaction hash
  const isValidHash = txHash && validateTxHash(txHash);

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

  // Build explorer link
  const explorerLink = txHash ? `https://explorer.test.mezo.org/tx/${txHash}` : null;

  // Format timestamp (current time for MVP)
  const timestamp = new Date().toLocaleString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });

  // Truncate address helper
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Invalid transaction hash
  if (!isValidHash) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
        <div className="w-full max-w-md rounded-lg border border-red-200 bg-white p-8 text-center shadow-sm">
          <div className="mb-4 text-red-600">
            <svg
              className="mx-auto h-12 w-12"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h1 className="mb-2 text-xl font-semibold text-slate-900">
            Invalid transaction link
          </h1>
          <p className="text-sm text-slate-600">
            The transaction hash provided is invalid or malformed.
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <div
        className={`w-full max-w-2xl transition-opacity duration-300 ${
          isVisible ? 'opacity-100' : 'opacity-0'
        }`}
      >
        {/* Success icon with animation */}
        <div className="mb-6 text-center">
          <CheckCircle2
            className="mx-auto h-16 w-16 text-teal-500 sm:h-20 sm:w-20"
            aria-label="Success checkmark"
          />
        </div>

        {/* Headline */}
        <h1 className="mb-8 text-center text-2xl font-bold text-slate-900 sm:text-3xl">
          Your support means the world!
        </h1>

        {/* Transaction summary card */}
        <div className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
          <div className="mb-4 border-b border-slate-100 pb-4">
            <h2 className="text-sm font-medium text-slate-500">Transaction Summary</h2>
          </div>

          <div className="space-y-4">
            {/* Amount sent */}
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Amount Sent</span>
              <span className="text-sm font-medium text-slate-900">
                Tip sent successfully
              </span>
            </div>

            {/* Timestamp */}
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Time</span>
              <span className="text-sm font-medium text-slate-900">{timestamp}</span>
            </div>

            {/* Transaction hash (truncated) */}
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Transaction ID</span>
              <button
                onClick={handleCopyTxHash}
                className="flex items-center gap-1 text-sm font-mono font-medium text-slate-900 hover:text-teal-600"
                aria-label="Copy transaction hash"
              >
                {truncateAddress(txHash)}
                <Copy className="h-3 w-3" />
              </button>
            </div>
          </div>
        </div>

        {/* Thank you message */}
        <div className="mb-6 rounded-lg bg-teal-50 p-4 text-center">
          <p className="text-sm text-teal-800">
            Thank you for your support! ❤️
          </p>
        </div>

        {/* Blockchain explorer link (collapsible) */}
        <div className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <button
            onClick={() => setShowExplorerDetails(!showExplorerDetails)}
            className="flex w-full items-center justify-between p-4 hover:bg-slate-50"
            aria-expanded={showExplorerDetails}
            aria-label="Toggle blockchain explorer details"
          >
            <span className="text-sm font-medium text-slate-700">
              View on blockchain explorer
            </span>
            {showExplorerDetails ? (
              <ChevronUp className="h-4 w-4 text-slate-600" />
            ) : (
              <ChevronDown className="h-4 w-4 text-slate-600" />
            )}
          </button>

          {showExplorerDetails && explorerLink && (
            <div className="border-t border-slate-100 p-4">
              <div className="mb-3">
                <p className="mb-2 text-xs font-medium text-slate-500">
                  Full Transaction Hash
                </p>
                <div className="rounded bg-slate-50 p-3">
                  <code className="break-all text-xs font-mono text-slate-700">
                    {txHash}
                  </code>
                </div>
              </div>

              <a
                href={explorerLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-md bg-teal-500 px-4 py-2 text-sm font-medium text-white hover:bg-teal-600"
              >
                Open Mezo Explorer
                <ExternalLink className="h-4 w-4" />
              </a>
            </div>
          )}
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

export default function TransactionConfirmationPage() {
  return (
    <Suspense
      fallback={
        <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
          <div className="text-sm text-slate-600">Loading...</div>
        </main>
      }
    >
      <TransactionConfirmationContent />
    </Suspense>
  );
}
