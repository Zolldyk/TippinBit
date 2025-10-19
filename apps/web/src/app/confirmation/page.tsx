'use client';

import { Suspense, useEffect, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { isAddress } from 'viem';
import type { Address } from 'viem';
import { validateTxHash } from '@/lib/error-parser';
import { TransactionConfirmationContent } from '@/components/organisms/TransactionConfirmationContent';

/**
 * TransactionConfirmationPage displays success message after a tip is sent.
 *
 * Features:
 * - Success checkmark animation
 * - Transaction summary (amount, recipient, timestamp)
 * - Blockchain explorer link (collapsible)
 * - Copy transaction hash functionality
 * - Shareable via direct URL
 * - Social sharing
 * - Return to creator button (when referrer detected)
 *
 * URL: /confirmation?tx=0x...&amount=5.00&recipient=0x...&ref=https://...
 */
function ConfirmationPageContent() {
  const searchParams = useSearchParams();
  const [timestamp, setTimestamp] = useState<string>('');

  // Extract URL parameters
  const txHash = searchParams.get('tx');
  const amountParam = searchParams.get('amount');
  const recipientParam = searchParams.get('recipient');
  const usernameParam = searchParams.get('username');

  // Validate transaction hash
  const isValidHash = txHash && validateTxHash(txHash);

  // Validate and format amount (must be numeric with 2 decimals, e.g., "5.00")
  const validateAmount = (amount: string | null): string | null => {
    if (!amount) return null;
    const amountRegex = /^\d+\.\d{2}$/;
    return amountRegex.test(amount) ? amount : null;
  };
  const validatedAmount = validateAmount(amountParam);

  // Validate recipient address
  const validatedRecipient =
    recipientParam && isAddress(recipientParam)
      ? (recipientParam as Address)
      : null;

  // Validate username (if provided)
  const validatedUsername =
    usernameParam && usernameParam.startsWith('@')
      ? (usernameParam as `@${string}`)
      : null;

  // Format timestamp (client-side)
  useEffect(() => {
    setTimestamp(
      new Date().toLocaleString('en-US', {
        month: 'long',
        day: 'numeric',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      })
    );
  }, []);

  // Invalid transaction hash - show error page
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

  // Valid transaction - render confirmation page
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 p-4">
      <TransactionConfirmationContent
        txHash={txHash}
        amount={validatedAmount}
        recipient={validatedRecipient}
        username={validatedUsername}
        timestamp={timestamp}
      />
    </main>
  );
}

export default function TransactionConfirmationPage() {
  return (
    <Suspense fallback={<div className="text-sm text-slate-600">Loading...</div>}>
      <ConfirmationPageContent />
    </Suspense>
  );
}
