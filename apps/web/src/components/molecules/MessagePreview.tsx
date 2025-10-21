'use client';

import { sanitizeMessage } from '@/lib/validation';

export interface MessagePreviewProps {
  /** Raw message text */
  message: string;
  /** Creator display name (@username or truncated address) */
  creatorDisplayName: string;
}

/**
 * Message Preview Component
 *
 * Shows live preview of how the thank-you message will appear on the
 * confirmation page. Updates in real-time as the user types.
 *
 * Features:
 * - Sanitizes message before display (XSS protection)
 * - Shows fallback message if empty
 * - Matches styling of confirmation page
 * - Mobile-responsive
 *
 * @example
 * ```typescript
 * <MessagePreview
 *   message="Thank you for the coffee! ❤️"
 *   creatorDisplayName="@alice"
 * />
 * ```
 */
export function MessagePreview({ message, creatorDisplayName }: MessagePreviewProps) {
  // Sanitize message
  const sanitizedMessage = message ? sanitizeMessage(message) : undefined;

  // Display message with creator name, or fallback
  const displayMessage = sanitizedMessage
    ? `${creatorDisplayName} says: ${sanitizedMessage}`
    : 'Thank you for your support! ❤️';

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">
        Preview
      </label>
      <div
        data-testid="message-preview"
        className="rounded-lg bg-teal-light/10 p-4 border border-teal-light"
      >
        <p className="text-center text-base text-gray-800">
          {displayMessage}
        </p>
      </div>
      <p className="text-xs text-gray-500">
        This is how supporters will see your message after tipping
      </p>
    </div>
  );
}
