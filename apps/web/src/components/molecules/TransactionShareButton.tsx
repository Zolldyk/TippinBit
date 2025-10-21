import { Share2, Camera, Music, Copy } from 'lucide-react';
import { useState } from 'react';
import type { Address } from 'viem';
import type { Username } from '@/types/domain';
import { truncateAddress } from '@/lib/formatting';

export interface TransactionShareButtonProps {
  recipient?: Address | null;
  username?: Username | null;
  txHash: string;
}

/**
 * TransactionShareButton component for sharing transaction confirmations on social media
 *
 * NOTE: This component shares transaction confirmation links (/confirmation?tx=0x...),
 * NOT creator payment links (/pay/@alice). For sharing creator payment links,
 * use UniversalShareButtons instead.
 *
 * Features:
 * - Twitter/X: Direct share with pre-filled message and hashtags
 * - Instagram: Copy link for manual sharing (no web intent available)
 * - TikTok: Copy link for manual sharing (no web intent available)
 * - Handles missing recipient gracefully
 * - Uses username in share text if provided (more readable than address)
 * - Toast notification on copy
 * - Accessible with proper ARIA labels
 *
 * @param recipient - Optional recipient Ethereum address
 * @param username - Optional username to display in share text
 * @param txHash - Transaction hash for the tip
 */
export function TransactionShareButton({
  recipient,
  username,
  txHash,
}: TransactionShareButtonProps) {
  const [showCopiedToast, setShowCopiedToast] = useState(false);
  const [copiedPlatform, setCopiedPlatform] = useState<string>('');

  // Generate shareable link
  const shareableLink = `https://tippinbit.com/confirmation?tx=${txHash}`;

  // Generate Twitter/X share URL
  const generateTwitterUrl = (): string => {
    // Prefer username over address for readability
    const baseText = username
      ? `I just tipped ${username} on @TippinBit! 🚀`
      : recipient
        ? `I just supported ${truncateAddress(recipient)} with @TippinBit! Zero fees, instant transfers. 🚀`
        : 'I just sent a tip with @TippinBit! Zero fees, instant transfers. 🚀';

    return `https://twitter.com/intent/tweet?${new URLSearchParams({
      text: baseText,
      url: shareableLink,
      hashtags: 'TippinBit,Mezo,MUSD',
    }).toString()}`;
  };

  // Handle copy link for Instagram/TikTok
  const handleCopyLink = async (platform: string) => {
    await navigator.clipboard.writeText(shareableLink);
    setCopiedPlatform(platform);
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 2000);
  };

  const twitterUrl = generateTwitterUrl();

  return (
    <div className="w-full">
      <h3 className="mb-3 text-center text-sm font-medium text-slate-700">
        Share your support
      </h3>

      <div className="flex flex-wrap items-center justify-center gap-3">
        {/* Twitter/X - Direct share */}
        <a
          href={twitterUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors duration-150 motion-reduce:transition-none motion-reduce:duration-0 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          aria-label="Share on X (Twitter)"
        >
          <Share2 className="h-4 w-4" aria-hidden="true" />
          X
        </a>

        {/* Instagram - Copy link */}
        <button
          onClick={() => handleCopyLink('Instagram')}
          className="inline-flex items-center gap-2 rounded-md bg-gradient-to-br from-purple-600 via-pink-600 to-orange-500 px-4 py-2 text-sm font-medium text-white hover:opacity-90 transition-opacity duration-150 motion-reduce:transition-none motion-reduce:duration-0 focus:outline-none focus:ring-2 focus:ring-pink-500 focus:ring-offset-2"
          aria-label="Copy link for Instagram"
        >
          <Camera className="h-4 w-4" aria-hidden="true" />
          Instagram
        </button>

        {/* TikTok - Copy link */}
        <button
          onClick={() => handleCopyLink('TikTok')}
          className="inline-flex items-center gap-2 rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white hover:bg-slate-800 transition-colors duration-150 motion-reduce:transition-none motion-reduce:duration-0 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2"
          aria-label="Copy link for TikTok"
        >
          <Music className="h-4 w-4" aria-hidden="true" />
          TikTok
        </button>
      </div>

      {/* Copied toast */}
      {showCopiedToast && (
        <div
          className="mt-3 rounded-md bg-slate-900 px-3 py-2 text-center text-xs text-white shadow-lg transition-opacity duration-200 motion-reduce:transition-none motion-reduce:duration-0"
          role="status"
          aria-live="polite"
        >
          <Copy className="mr-1 inline-block h-3 w-3" aria-hidden="true" />
          Link copied! Paste it in {copiedPlatform}
        </div>
      )}
    </div>
  );
}
