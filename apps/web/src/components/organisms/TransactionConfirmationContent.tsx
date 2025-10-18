'use client';

import { useState, useEffect } from 'react';
import { CheckCircle2 } from 'lucide-react';
import type { Address } from 'viem';
import { SocialShareButton } from '@/components/molecules/SocialShareButton';
import { ReturnButton } from '@/components/molecules/ReturnButton';
import { CopyButton } from '@/components/molecules/CopyButton';
import { CollapsibleExplorer } from '@/components/molecules/CollapsibleExplorer';

export interface TransactionConfirmationContentProps {
  txHash: string;
  amount?: string | null;
  recipient?: Address | null;
  timestamp: string;
}

/**
 * Client Component wrapper for transaction confirmation content
 * Handles fade-in animation and client-side interactivity
 */
export function TransactionConfirmationContent({
  txHash,
  amount,
  recipient,
  timestamp,
}: TransactionConfirmationContentProps) {
  const [isVisible, setIsVisible] = useState(false);

  // Trigger fade-in animation
  useEffect(() => {
    const timeout = setTimeout(() => setIsVisible(true), 100);
    return () => clearTimeout(timeout);
  }, []);

  // Truncate address helper
  const truncateAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  // Build explorer link
  const explorerLink = `https://explorer.test.mezo.org/tx/${txHash}`;

  return (
    <div
      className={`w-full max-w-2xl transition-opacity duration-300 motion-reduce:transition-none motion-reduce:duration-0 ${
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
              {amount ? `$${amount} MUSD` : 'Tip sent successfully'}
            </span>
          </div>

          {/* Recipient (only if provided) */}
          {recipient && (
            <div className="flex justify-between">
              <span className="text-sm text-slate-600">Recipient</span>
              <span className="text-sm font-mono font-medium text-slate-900">
                {truncateAddress(recipient)}
              </span>
            </div>
          )}

          {/* Timestamp */}
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Time</span>
            <span className="text-sm font-medium text-slate-900">{timestamp}</span>
          </div>

          {/* Transaction hash (truncated) */}
          <div className="flex justify-between">
            <span className="text-sm text-slate-600">Transaction ID</span>
            <CopyButton
              textToCopy={txHash}
              displayText={truncateAddress(txHash)}
              ariaLabel="Copy transaction hash"
            />
          </div>
        </div>
      </div>

      {/* Thank you message */}
      <div className="mb-6 rounded-lg bg-teal-50 p-4 text-center">
        <p className="text-sm text-teal-800">
          Thank you for your support! ❤️
        </p>
      </div>

      {/* Social sharing section */}
      <div className="mb-6 flex justify-center">
        <SocialShareButton recipient={recipient} txHash={txHash} />
      </div>

      {/* Return to creator button (only shown if external referrer detected) */}
      <div className="mb-6 flex justify-center">
        <ReturnButton />
      </div>

      {/* Blockchain explorer link (collapsible) */}
      <CollapsibleExplorer txHash={txHash} explorerUrl={explorerLink} />
    </div>
  );
}
