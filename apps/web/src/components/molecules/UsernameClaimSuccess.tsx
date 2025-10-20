'use client';

import { useState } from 'react';
import { Check } from 'lucide-react';
import { CopyButton } from './CopyButton';
import { Button } from '../atoms/Button';
import { QRCodeDisplay } from './QRCodeDisplay';
import { QRCodeDownloadButton } from '../atoms/QRCodeDownloadButton';
import { buildPaymentUrl, generateQRFilename } from '@/lib/payment-url';

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
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');

  // Build payment URL with optional amount
  const paymentUrl = buildPaymentUrl({
    username,
    ...(selectedAmount && { amount: selectedAmount }),
  });

  // Generate QR filename
  const qrFilename = generateQRFilename(username);

  // Amount presets (AC11)
  const amountPresets = ['3', '5', '10', '25'];

  const paymentLink = `tippinbit.com/pay/${username}`;
  const fullPaymentLink = `https://${paymentLink}`;

  return (
    <div
      className="bg-white border-2 border-green-200 rounded-lg p-6 space-y-6 animate-fadeIn"
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
          <CopyButton
            textToCopy={fullPaymentLink}
            displayText="Copy"
            ariaLabel="Copy payment link"
          />
        </div>
      </div>

      {/* QR Code Section (AC2, AC3, AC11) */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-900">
          QR Code for In-Person Tipping
        </h4>

        {/* Amount Selector (AC11) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Optional: Pre-fill amount
          </label>
          <div className="flex flex-wrap gap-2">
            {amountPresets.map((amount) => (
              <button
                key={amount}
                onClick={() => setSelectedAmount(amount)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                  selectedAmount === amount
                    ? 'bg-coral text-white border-coral'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-coral hover:text-coral'
                }`}
                aria-label={`Set amount to $${amount}`}
              >
                ${amount}
              </button>
            ))}
            <button
              onClick={() => setSelectedAmount('')}
              className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors ${
                selectedAmount === ''
                  ? 'bg-coral text-white border-coral'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-coral hover:text-coral'
              }`}
              aria-label="No preset amount"
            >
              No amount
            </button>
          </div>
          <p className="text-xs text-gray-500">
            Supporters can scan and confirm without typing an amount
          </p>
        </div>

        {/* QR Code Display (AC2: auto-updates) */}
        <div className="flex flex-col items-center gap-4 bg-gray-50 rounded-lg p-6">
          <QRCodeDisplay
            paymentUrl={paymentUrl}
            size={300}
            showLogo={true}
            onGenerated={setQrCodeDataUrl}
          />

          {/* Download Button (AC5) */}
          <QRCodeDownloadButton
            qrCodeDataUrl={qrCodeDataUrl}
            filename={qrFilename}
            variant="primary"
          />

          {/* Payment URL Display (for print) */}
          <p className="text-xs text-gray-600 font-mono break-all text-center payment-url-text">
            {paymentUrl}
          </p>
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
