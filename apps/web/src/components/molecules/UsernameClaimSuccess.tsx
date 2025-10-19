'use client';

import { Check } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { Button } from '../atoms/Button';

export interface UsernameClaimSuccessProps {
  /**
   * The claimed username (with @ prefix)
   */
  username: string;

  /**
   * Callback when user wants to create another username
   */
  onCreateAnother?: () => void;
}

/**
 * Username Claim Success Component
 *
 * Displays success state after username is successfully claimed.
 *
 * Features:
 * - Success checkmark with coral color
 * - Payment link display
 * - Copy button for link
 * - Fade-in animation
 * - Option to create another username
 *
 * @example
 * ```typescript
 * <UsernameClaimSuccess
 *   username="@alice"
 *   onCreateAnother={() => setShowForm(true)}
 * />
 * ```
 */
export function UsernameClaimSuccess({
  username,
  onCreateAnother,
}: UsernameClaimSuccessProps) {
  const paymentLink = `tippinbit.com/pay/${username}`;
  const fullPaymentLink = `https://${paymentLink}`;

  return (
    <div
      className="bg-white border-2 border-green-200 rounded-lg p-6 space-y-4 animate-fadeIn"
      role="status"
      aria-live="polite"
    >
      {/* Success Icon and Message */}
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
          <Check className="w-6 h-6 text-green-600" aria-hidden="true" />
        </div>
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            ✓ {username} claimed!
          </h3>
          <p className="text-sm text-gray-600">
            Your payment link is ready to share
          </p>
        </div>
      </div>

      {/* Payment Link */}
      <div className="bg-gray-50 rounded-lg p-4 space-y-2">
        <label
          htmlFor="payment-link"
          className="block text-sm font-medium text-gray-700"
        >
          Your payment link
        </label>
        <div className="flex items-center gap-2">
          <input
            id="payment-link"
            type="text"
            value={paymentLink}
            readOnly
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
            aria-label="Payment link"
          />
          <CopyButton textToCopy={fullPaymentLink} />
        </div>
      </div>

      {/* Info Text */}
      <p className="text-sm text-gray-600">
        Anyone can now send you payments by visiting this link. Share it on
        social media, add it to your bio, or send it directly to supporters!
      </p>

      {/* Create Another Button */}
      {onCreateAnother && (
        <Button
          variant="secondary"
          onClick={onCreateAnother}
          className="w-full md:w-auto"
        >
          Create another link
        </Button>
      )}
    </div>
  );
}
