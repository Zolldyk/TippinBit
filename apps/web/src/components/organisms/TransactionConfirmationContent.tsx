'use client';

import { motion } from 'motion/react';
import type { Address } from 'viem';
import type { Username } from '@/types/domain';
import { TransactionShareButton } from '@/components/molecules/TransactionShareButton';
import { UniversalShareButtons } from '@/components/molecules/UniversalShareButtons';
import { ReturnButton } from '@/components/molecules/ReturnButton';
import { CopyButton } from '@/components/molecules/CopyButton';
import { CollapsibleExplorer } from '@/components/molecules/CollapsibleExplorer';
import { buildPaymentUrl } from '@/lib/payment-url';
import { truncateAddress } from '@/lib/formatting';
import { sanitizeMessage } from '@/lib/validation';
import {
  confirmationContainerVariants,
  confirmationChildVariants,
  useReducedMotion,
  ANIMATION_TIMING,
} from '@/lib/animations';

export interface TransactionConfirmationContentProps {
  txHash: string;
  amount?: string | null;
  recipient?: Address | null;
  username?: Username | null;
  timestamp: string;
  thankyouMessage?: string;
}

/**
 * Client Component wrapper for transaction confirmation content
 * Handles fade-in animation and client-side interactivity
 *
 * When username is provided, it's used in social sharing for better readability.
 */
export function TransactionConfirmationContent({
  txHash,
  amount,
  recipient,
  username,
  timestamp,
  thankyouMessage,
}: TransactionConfirmationContentProps) {
  const shouldReduceMotion = useReducedMotion();

  // Build creator payment URL (AC7, AC9)
  const creatorPaymentUrl = username
    ? buildPaymentUrl({ username })
    : recipient
      ? buildPaymentUrl({ address: recipient })
      : null;

  // Creator display name for share text (AC7, AC9)
  const creatorDisplayName = username || (recipient ? truncateAddress(recipient) : 'this creator');

  // Sanitize and prepare thank-you message (AC8, AC9, AC10)
  const sanitizedMessage = thankyouMessage ? sanitizeMessage(thankyouMessage) : undefined;
  const displayMessage = sanitizedMessage
    ? `${creatorDisplayName} says: ${sanitizedMessage}`
    : 'Thank you for your support! ❤️';

  // Build explorer link
  const explorerLink = `https://explorer.test.mezo.org/tx/${txHash}`;

  return (
    <motion.div
      className="w-full max-w-2xl"
      {...(!shouldReduceMotion && { variants: confirmationContainerVariants })}
      initial="hidden"
      animate="visible"
    >
      {/* Success checkmark with SVG path animation (AC 9) */}
      <div className="mb-6 text-center">
        <motion.svg
          width="80"
          height="80"
          viewBox="0 0 100 100"
          className="mx-auto text-teal-500"
          aria-label="Success checkmark"
        >
          <motion.path
            d="M20,50 L40,70 L80,30"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeLinecap="round"
            strokeLinejoin="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{
              duration: shouldReduceMotion
                ? 0
                : ANIMATION_TIMING.CHECKMARK_DRAW_DURATION,
              ease: 'easeOut',
            }}
          />
        </motion.svg>
      </div>

      {/* Headline with stagger animation (AC 9) */}
      <motion.h1
        {...(!shouldReduceMotion && { variants: confirmationChildVariants })}
        className="mb-8 text-center text-2xl font-bold text-slate-900 sm:text-3xl"
      >
        Your support means the world!
      </motion.h1>

      {/* Transaction summary card with stagger animation (AC 9) */}
      <motion.div
        {...(!shouldReduceMotion && { variants: confirmationChildVariants })}
        className="mb-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm"
      >
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
      </motion.div>

      {/* Thank you message with stagger animation (AC 8, AC 9) */}
      <motion.div
        {...(!shouldReduceMotion && { variants: confirmationChildVariants })}
        className="mb-6 rounded-lg bg-teal-light/10 p-4 border border-teal-light text-center"
      >
        <p className="text-base text-gray-800">
          {displayMessage}
        </p>
      </motion.div>

      {/* Universal sharing section - Share creator's payment link */}
      {creatorPaymentUrl && (
        <motion.div
          {...(!shouldReduceMotion && { variants: confirmationChildVariants })}
          className="mb-6 flex justify-center"
        >
          <UniversalShareButtons
            creatorPaymentUrl={creatorPaymentUrl}
            creatorDisplayName={creatorDisplayName}
          />
        </motion.div>
      )}

      {/* Transaction sharing section - Share transaction confirmation */}
      <motion.div
        {...(!shouldReduceMotion && { variants: confirmationChildVariants })}
        className="mb-6 flex justify-center"
      >
        <TransactionShareButton
          {...(recipient !== undefined && { recipient })}
          {...(username !== undefined && { username })}
          txHash={txHash}
        />
      </motion.div>

      {/* Return to creator button (only shown if external referrer detected) */}
      <motion.div
        {...(!shouldReduceMotion && { variants: confirmationChildVariants })}
        className="mb-6 flex justify-center"
      >
        <ReturnButton />
      </motion.div>

      {/* Blockchain explorer link (collapsible) */}
      <motion.div {...(!shouldReduceMotion && { variants: confirmationChildVariants })}>
        <CollapsibleExplorer txHash={txHash} explorerUrl={explorerLink} />
      </motion.div>
    </motion.div>
  );
}
