'use client';

import { Copy } from 'lucide-react';
import { useState } from 'react';

export interface CopyButtonProps {
  textToCopy: string;
  displayText: string;
  ariaLabel?: string;
}

/**
 * CopyButton component for copying text to clipboard
 *
 * Features:
 * - Copies text to clipboard on click
 * - Shows temporary "Copied!" toast notification
 * - Accessible with proper ARIA labels
 * - Respects prefers-reduced-motion
 */
export function CopyButton({
  textToCopy,
  displayText,
  ariaLabel = 'Copy to clipboard',
}: CopyButtonProps) {
  const [showCopiedToast, setShowCopiedToast] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(textToCopy);
    setShowCopiedToast(true);
    setTimeout(() => setShowCopiedToast(false), 2000);
  };

  return (
    <>
      <button
        onClick={handleCopy}
        className="flex items-center gap-1 text-sm font-mono font-medium text-slate-900 hover:text-teal-600 transition-colors duration-150 motion-reduce:transition-none motion-reduce:duration-0"
        aria-label={ariaLabel}
      >
        {displayText}
        <Copy className="h-3 w-3" />
      </button>

      {/* Copied toast */}
      {showCopiedToast && (
        <div
          className="fixed bottom-4 right-4 rounded-md bg-slate-900 px-4 py-2 text-sm text-white shadow-lg transition-opacity duration-200 motion-reduce:transition-none motion-reduce:duration-0"
          role="status"
          aria-live="polite"
        >
          Copied!
        </div>
      )}
    </>
  );
}
