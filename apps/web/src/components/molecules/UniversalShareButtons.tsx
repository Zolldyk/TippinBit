'use client';

import { useState, useEffect } from 'react';
import { Share2, Twitter, Copy } from 'lucide-react';
import { toast } from 'sonner';

export interface UniversalShareButtonsProps {
  /** Creator's payment URL (e.g., https://tippinbit.com/pay/@alice) */
  creatorPaymentUrl: string;
  /** Creator display name for share text (e.g., "@alice" or "0x1234...5678") */
  creatorDisplayName: string;
}

/**
 * UniversalShareButtons component for sharing creator payment links
 *
 * Provides universal sharing options with mobile/desktop adaptive UI:
 * - Primary action: Copy link button (always visible)
 * - Mobile: Native share API (navigator.share)
 * - Desktop: Twitter quick share button
 *
 * Features:
 * - Detects mobile vs desktop using navigator.share availability
 * - Toast notifications on copy (via sonner)
 * - Pre-filled share text for native share and Twitter
 * - Full accessibility with ARIA labels
 * - Analytics placeholders via console.log
 *
 * @example
 * ```tsx
 * <UniversalShareButtons
 *   creatorPaymentUrl="https://tippinbit.com/pay/@alice"
 *   creatorDisplayName="@alice"
 * />
 * ```
 */
export function UniversalShareButtons({
  creatorPaymentUrl,
  creatorDisplayName,
}: UniversalShareButtonsProps) {
  const [isMobile, setIsMobile] = useState(false);

  // Detect if native share is available (mobile devices)
  useEffect(() => {
    setIsMobile(typeof navigator !== 'undefined' && !!navigator.share);
  }, []);

  // Primary action: Copy link (AC1)
  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(creatorPaymentUrl);
      toast.success('Link copied! Share it anywhere.', { duration: 3000 });
      console.log('[Analytics] Share method: copy'); // AC11
    } catch {
      toast.error('Failed to copy link. Please try again.');
    }
  };

  // Native share for mobile (AC2, AC3)
  const handleNativeShare = async () => {
    try {
      await navigator.share({
        title: `Support ${creatorDisplayName} on TippinBit`,
        text: `I just tipped ${creatorDisplayName} with TippinBit. You can too!`,
        url: creatorPaymentUrl,
      });
      console.log('[Analytics] Share method: native'); // AC11
    } catch (error) {
      // User cancelled share - no need to show error
      if ((error as Error).name !== 'AbortError') {
        console.error('Share failed:', error);
      }
    }
  };

  // Twitter quick share for desktop (AC4)
  const handleTwitterShare = () => {
    const twitterText = `I just supported ${creatorDisplayName} with @TippinBit 🚀`;
    const twitterUrl = `https://twitter.com/intent/tweet?${new URLSearchParams({
      text: twitterText,
      url: creatorPaymentUrl,
    }).toString()}`;

    window.open(twitterUrl, '_blank', 'noopener,noreferrer');
    console.log('[Analytics] Share method: twitter'); // AC11
  };

  return (
    <div className="w-full">
      <h3 className="mb-3 text-center text-sm font-medium text-slate-700">
        Share creator&apos;s link
      </h3>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Primary: Copy link button (always visible, AC1, AC8) */}
        <button
          onClick={handleCopyLink}
          className="inline-flex items-center gap-2 rounded-lg bg-coral px-4 py-2 text-sm font-medium text-white hover:bg-coral-dark transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-coral focus:ring-offset-2 min-h-[44px]"
          aria-label="Copy payment link to clipboard"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy link
        </button>

        {/* Mobile: Native share (AC2, AC3, AC8) */}
        {isMobile && (
          <button
            onClick={handleNativeShare}
            className="inline-flex items-center gap-2 rounded-lg bg-teal px-4 py-2 text-sm font-medium text-white hover:bg-teal-dark transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-teal focus:ring-offset-2 min-h-[44px]"
            aria-label="Share creator's payment link"
          >
            <Share2 className="h-4 w-4" aria-hidden="true" />
            Share
          </button>
        )}

        {/* Desktop: Twitter quick share (AC4, AC8) */}
        {!isMobile && (
          <button
            onClick={handleTwitterShare}
            className="inline-flex items-center gap-2 rounded-lg border-2 border-slate-700 bg-transparent px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-700 hover:text-white transition-colors duration-150 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 min-h-[44px]"
            aria-label="Share creator's payment link on Twitter"
          >
            <Twitter className="h-4 w-4" aria-hidden="true" />
            Share on Twitter
          </button>
        )}
      </div>
    </div>
  );
}
