'use client';

import { Twitter, Mail, Copy } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '../atoms/Button';
import type { SocialShareButtonsProps } from '@/types/domain';

/**
 * Social Share Buttons Component
 *
 * Provides quick sharing options for payment links.
 *
 * Features:
 * - Twitter share with pre-filled tweet
 * - Email share with mailto link
 * - Copy link button with toast notification
 * - Accessible with proper ARIA labels
 *
 * @example
 * ```typescript
 * <SocialShareButtons
 *   paymentUrl="https://tippinbit.com/pay/@alice"
 *   username="@alice"
 * />
 * ```
 */
export function SocialShareButtons({
  paymentUrl,
  username,
}: SocialShareButtonsProps) {
  // Twitter share intent (AC8)
  const twitterText = username
    ? `Check out my TippinBit link: ${paymentUrl}`
    : `Support me on TippinBit: ${paymentUrl}`;
  const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(twitterText)}`;

  // Email share (AC8)
  const emailSubject = 'Support me on TippinBit';
  const emailBody = `You can send me tips at: ${paymentUrl}`;
  const emailUrl = `mailto:?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;

  // Handle copy link (AC2)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(paymentUrl);
      toast.success('Copied!', { duration: 3000 });
    } catch (error) {
      console.error('Failed to copy:', error);
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="space-y-3">
      <label className="block text-sm font-medium text-gray-700">
        Share your link
      </label>
      <div className="flex flex-wrap gap-2">
        {/* Twitter Share */}
        <Button
          variant="secondary"
          onClick={() => window.open(twitterUrl, '_blank', 'noopener,noreferrer')}
          aria-label="Share on Twitter"
          className="min-h-[44px]"
        >
          <Twitter className="w-4 h-4 mr-2" aria-hidden="true" />
          Share on Twitter
        </Button>

        {/* Email Share */}
        <Button
          variant="secondary"
          onClick={() => (window.location.href = emailUrl)}
          aria-label="Share via email"
          className="min-h-[44px]"
        >
          <Mail className="w-4 h-4 mr-2" aria-hidden="true" />
          Email link
        </Button>

        {/* Copy Link */}
        <Button
          variant="secondary"
          onClick={handleCopy}
          aria-label="Copy link to clipboard"
          className="min-h-[44px]"
        >
          <Copy className="w-4 h-4 mr-2" aria-hidden="true" />
          Copy link
        </Button>
      </div>
    </div>
  );
}
