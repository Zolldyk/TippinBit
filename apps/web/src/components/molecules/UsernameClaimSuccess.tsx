'use client';

import { useState, useRef, useEffect } from 'react';
import { Check, ExternalLink } from 'lucide-react';
import { useAccount } from 'wagmi';
import { Button } from '../atoms/Button';
import { Input } from '../atoms/Input';
import { QRCodeDisplay } from './QRCodeDisplay';
import { QRCodeDownloadButton } from '../atoms/QRCodeDownloadButton';
import { SocialShareButtons } from './SocialShareButtons';
import { buildPaymentUrl, generateQRFilename } from '@/lib/payment-url';
import { useDebounce } from '@/hooks/useDebounce';
import type { LinkFormat } from '@/types/domain';

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
  const { address } = useAccount();
  const [linkFormat, setLinkFormat] = useState<LinkFormat>('username');
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [whiteBackground, setWhiteBackground] = useState(false);
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Debounce custom amount input (AC4)
  const debouncedCustomAmount = useDebounce(customAmount, 300);

  // Determine current amount value
  const currentAmount = showCustomInput && debouncedCustomAmount
    ? debouncedCustomAmount
    : selectedAmount || undefined;

  // Build payment URL based on link format (AC5)
  const paymentUrl = linkFormat === 'username'
    ? buildPaymentUrl({
        username,
        ...(currentAmount && { amount: currentAmount }),
      })
    : address
      ? buildPaymentUrl({
          address,
          ...(currentAmount && { amount: currentAmount }),
        })
      : buildPaymentUrl({
          username,
          ...(currentAmount && { amount: currentAmount }),
        });

  // Generate QR filename
  const qrFilename = generateQRFilename(username);

  // Amount presets (AC4, AC11)
  const amountPresets = ['3', '5', '10', '25'];

  // Handle custom amount selection
  const handleCustomClick = () => {
    setShowCustomInput(true);
    setSelectedAmount('');
  };

  // Handle preset amount click
  const handlePresetClick = (amount: string) => {
    setShowCustomInput(false);
    setCustomAmount('');
    setSelectedAmount(amount);
  };

  // Handle clearing amount
  const handleClearAmount = () => {
    setShowCustomInput(false);
    setSelectedAmount('');
    setCustomAmount('');
  };

  // Validate custom amount (AC4: max 2 decimal places, positive number)
  const handleCustomAmountChange = (value: string) => {
    // Allow empty string
    if (value === '') {
      setCustomAmount('');
      return;
    }

    // Validate format: positive number with max 2 decimal places
    const regex = /^\d+(\.\d{0,2})?$/;
    if (regex.test(value)) {
      const numValue = parseFloat(value);
      // Reasonable max amount: $100,000
      if (numValue >= 0 && numValue <= 100000) {
        setCustomAmount(value);
      }
    }
  };

  // Handle test link click (AC3)
  const handleTestLink = () => {
    if (paymentUrl) {
      window.open(paymentUrl, '_blank', 'noopener,noreferrer');
    }
  };

  // Auto-scroll to QR code on mobile after generation (AC11)
  useEffect(() => {
    if (paymentUrl && qrContainerRef.current) {
      if (window.innerWidth < 768) {
        setTimeout(() => {
          qrContainerRef.current?.scrollIntoView({
            behavior: 'smooth',
            block: 'nearest',
          });
        }, 100);
      }
    }
  }, [paymentUrl]);

  // Display link without protocol for cleaner UI
  const displayLink = paymentUrl.replace(/^https?:\/\//, '');

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
      <div className="bg-gray-50 rounded-lg p-4 space-y-3">
        {/* Link Format Selector (AC5) */}
        {address && (
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-700">
              Link format
            </label>
            <div className="flex gap-4">
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <input
                  type="radio"
                  checked={linkFormat === 'username'}
                  onChange={() => setLinkFormat('username')}
                  className="rounded-full min-h-[20px] min-w-[20px]"
                  aria-label={`Use @${username.replace('@', '')}`}
                />
                <span className="text-sm">Use {username}</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer min-h-[44px]">
                <input
                  type="radio"
                  checked={linkFormat === 'address'}
                  onChange={() => setLinkFormat('address')}
                  className="rounded-full min-h-[20px] min-w-[20px]"
                  aria-label="Use wallet address"
                />
                <span className="text-sm">Use wallet address</span>
              </label>
            </div>
          </div>
        )}

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
            value={displayLink}
            readOnly
            className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
            aria-label="Payment link"
          />
        </div>

        {/* Test Link Button (AC3) */}
        <Button
          variant="secondary"
          onClick={handleTestLink}
          className="w-full md:w-auto min-h-[44px]"
          aria-label="Preview how supporters will see your payment page"
        >
          <ExternalLink className="w-4 h-4 mr-2" aria-hidden="true" />
          Test your link
        </Button>
      </div>

      {/* QR Code Section (AC2, AC3, AC4, AC7, AC11) */}
      <div className="space-y-4">
        <h4 className="text-md font-semibold text-gray-900">
          QR Code for In-Person Tipping
        </h4>

        {/* Amount Selector (AC4, AC11) */}
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Optional: Pre-fill amount
          </label>
          <div className="flex flex-wrap gap-2">
            {amountPresets.map((amount) => (
              <button
                key={amount}
                onClick={() => handlePresetClick(amount)}
                className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors min-h-[44px] ${
                  selectedAmount === amount && !showCustomInput
                    ? 'bg-coral text-white border-coral'
                    : 'bg-white text-gray-700 border-gray-300 hover:border-coral hover:text-coral'
                }`}
                aria-label={`Set amount to $${amount}`}
                aria-pressed={selectedAmount === amount && !showCustomInput}
              >
                ${amount}
              </button>
            ))}
            <button
              onClick={handleCustomClick}
              className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors min-h-[44px] ${
                showCustomInput
                  ? 'bg-coral text-white border-coral'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-coral hover:text-coral'
              }`}
              aria-label="Enter custom amount"
              aria-pressed={showCustomInput}
            >
              Custom
            </button>
            <button
              onClick={handleClearAmount}
              className={`px-4 py-2 text-sm font-medium rounded-lg border-2 transition-colors min-h-[44px] ${
                !selectedAmount && !showCustomInput
                  ? 'bg-coral text-white border-coral'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-coral hover:text-coral'
              }`}
              aria-label="No preset amount"
              aria-pressed={!selectedAmount && !showCustomInput}
            >
              No amount
            </button>
          </div>

          {/* Custom Amount Input (AC4) */}
          {showCustomInput && (
            <div className="mt-2">
              <Input
                type="text"
                inputMode="decimal"
                placeholder="Enter amount (e.g., 12.50)"
                value={customAmount}
                onChange={(e) => handleCustomAmountChange(e.target.value)}
                aria-label="Custom tip amount in USD"
              />
              <p className="text-xs text-gray-500 mt-1">
                Maximum $100,000, up to 2 decimal places
              </p>
            </div>
          )}
          <p className="text-xs text-gray-500">
            Supporters can scan and confirm without typing an amount
          </p>
        </div>

        {/* QR Code Display (AC2: auto-updates, AC7: background toggle) */}
        <div
          ref={qrContainerRef}
          className="flex flex-col items-center gap-4 bg-gray-50 rounded-lg p-6"
        >
          <QRCodeDisplay
            paymentUrl={paymentUrl}
            size={300}
            showLogo={true}
            backgroundColor={whiteBackground ? '#FFFFFF' : '#00000000'}
            onGenerated={setQrCodeDataUrl}
          />

          {/* Background Toggle (AC7) */}
          <label className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={whiteBackground}
              onChange={(e) => setWhiteBackground(e.target.checked)}
              className="rounded min-h-[20px] min-w-[20px]"
              aria-label="Use white background for QR code"
            />
            <span>White background</span>
          </label>

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

      {/* Social Sharing (AC8) */}
      <SocialShareButtons paymentUrl={paymentUrl} username={username} />

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
