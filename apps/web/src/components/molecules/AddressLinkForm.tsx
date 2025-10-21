'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { isAddress } from 'viem';
import { useAccount } from 'wagmi';
import { ExternalLink } from 'lucide-react';
import { Input } from '../atoms/Input';
import { Button } from '../atoms/Button';
import { QRCodeDisplay } from './QRCodeDisplay';
import { QRCodeDownloadButton } from '../atoms/QRCodeDownloadButton';
import { SocialShareButtons } from './SocialShareButtons';
import { WalletConnector } from '../organisms/WalletConnector';
import { MessagePreview } from './MessagePreview';
import { buildPaymentUrl, generateQRFilename } from '@/lib/payment-url';
import { truncateAddress } from '@/lib/formatting';
import { validateMessageLength } from '@/lib/validation';
import { useDebounce } from '@/hooks/useDebounce';
import type { AddressLinkFormProps, Address } from '@/types/domain';

/**
 * Address Link Form Component
 *
 * Allows creators to generate payment links using wallet address directly.
 * Alternative to username-based links for users who haven't claimed a username.
 *
 * Features:
 * - Address input with validation (AC1)
 * - Real-time link generation (AC6)
 * - Copy button with toast notification (AC2)
 * - "Test your link" button (AC3)
 * - Amount presets + custom input (AC4)
 * - QR code with background toggle (AC7)
 * - Social sharing buttons (AC8)
 * - Permalink support (AC9)
 * - Empty state with wallet connection (AC10)
 * - Mobile-optimized with auto-scroll (AC11)
 * - Full accessibility (AC12)
 *
 * @example
 * ```typescript
 * <AddressLinkForm prefilledAddress="0x742d35Cc..." />
 * ```
 */
export function AddressLinkForm({ prefilledAddress }: AddressLinkFormProps) {
  const { address: connectedAddress } = useAccount();
  const [address, setAddress] = useState<string>(prefilledAddress || '');
  const [selectedAmount, setSelectedAmount] = useState<string>('');
  const [customAmount, setCustomAmount] = useState<string>('');
  const [showCustomInput, setShowCustomInput] = useState(false);
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [whiteBackground, setWhiteBackground] = useState(false);
  const [message, setMessage] = useState<string>('');
  const qrContainerRef = useRef<HTMLDivElement>(null);

  // Debounce custom amount input to prevent excessive re-renders (AC4)
  const debouncedCustomAmount = useDebounce(customAmount, 300);

  // Auto-fill connected wallet address if available and no address entered
  useEffect(() => {
    if (connectedAddress && !address) {
      setAddress(connectedAddress);
    }
  }, [connectedAddress, address]);

  // Validate address (AC1)
  const isValidAddress = address && isAddress(address);

  // Validate message length
  const messageValidation = validateMessageLength(message);
  const isMessageValid = messageValidation.isValid;

  // Character count for display
  const charactersRemaining = 200 - message.length;

  // Creator display name for preview
  const creatorDisplayName = isValidAddress ? truncateAddress(address) : '';

  // Determine current amount value
  const currentAmount = showCustomInput && debouncedCustomAmount
    ? debouncedCustomAmount
    : selectedAmount || undefined;

  // Build payment URL (AC6: real-time updates)
  const paymentUrl = useMemo(() => {
    if (!isValidAddress) return '';
    return buildPaymentUrl({
      address: address as Address,
      ...(currentAmount && { amount: currentAmount }),
      ...(message && isMessageValid && { message }),
    });
  }, [isValidAddress, address, currentAmount, message, isMessageValid]);

  // Generate QR filename
  const qrFilename = useMemo(() => {
    if (!isValidAddress) return '';
    return generateQRFilename(undefined, address as Address);
  }, [isValidAddress, address]);

  // Amount presets (AC4)
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
      // Check if mobile viewport
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

  // Empty state (AC10)
  if (!address && !connectedAddress) {
    return (
      <div className="text-center p-8 bg-gray-50 rounded-lg space-y-4">
        <p className="text-gray-600">
          Connect your wallet or enter an address to get started
        </p>
        <div className="flex justify-center">
          <WalletConnector />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Address Input (AC1) */}
      <div>
        <label
          htmlFor="address-input"
          className="block text-sm font-medium text-gray-700 mb-2"
        >
          Wallet address
        </label>
        <Input
          id="address-input"
          type="text"
          placeholder="0x..."
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          className="font-mono"
          aria-label="Ethereum wallet address"
          aria-invalid={address && !isValidAddress ? 'true' : 'false'}
          aria-describedby={address && !isValidAddress ? 'address-error' : undefined}
        />
        {address && !isValidAddress && (
          <p id="address-error" className="mt-1 text-sm text-red-600" role="alert">
            Invalid Ethereum address
          </p>
        )}
      </div>

      {/* Thank-you Message Input (AC1, AC2, AC3, AC4, AC13) */}
      <div className="space-y-2">
        <label
          htmlFor="thankyou-message"
          className="block text-sm font-medium text-gray-700"
        >
          Thank-you message (optional)
        </label>
        <textarea
          id="thankyou-message"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Optional: Add a personal message (e.g., 'Thank you for the coffee! ❤️')"
          maxLength={200}
          rows={3}
          className="w-full resize-none overflow-y-auto px-4 py-3 text-base
            border border-gray-300 rounded-lg
            focus:border-coral focus:ring-2 focus:ring-coral focus:outline-none
            min-h-[80px] max-h-[200px]"
          aria-describedby="char-counter message-validation-error"
          aria-label="Thank-you message (optional)"
        />

        {/* Character Counter (AC3, AC13) */}
        <div
          id="char-counter"
          className="text-sm text-gray-600"
          aria-live="polite"
          aria-atomic="true"
        >
          {charactersRemaining} characters remaining
        </div>

        {/* Validation Error (AC4, AC13) */}
        {!isMessageValid && (
          <div
            id="message-validation-error"
            className="text-sm text-red-600"
            role="alert"
            aria-live="assertive"
          >
            {messageValidation.error}
          </div>
        )}
      </div>

      {/* Message Preview (AC11) */}
      {isValidAddress && message && (
        <MessagePreview
          message={message}
          creatorDisplayName={creatorDisplayName}
        />
      )}

      {/* Payment Link Display (AC1) */}
      {isValidAddress && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-3">
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
              value={paymentUrl}
              readOnly
              className="flex-1 px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-coral focus:border-transparent"
              aria-label="Generated payment link"
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
      )}

      {/* Amount Selector (AC4) */}
      {isValidAddress && (
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
                    : 'bg-white text-gray-700 border-gray-300 hover:border-coral'
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
                  : 'bg-white text-gray-700 border-gray-300 hover:border-coral'
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
                  : 'bg-white text-gray-700 border-gray-300 hover:border-coral'
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
      )}

      {/* QR Code Section (AC7) */}
      {isValidAddress && (
        <div
          ref={qrContainerRef}
          className="space-y-4 bg-gray-50 rounded-lg p-6"
        >
          <h4 className="text-md font-semibold">QR Code</h4>

          <div className="flex flex-col items-center gap-4">
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

            <QRCodeDownloadButton
              qrCodeDataUrl={qrCodeDataUrl}
              filename={qrFilename}
            />
          </div>
        </div>
      )}

      {/* Social Sharing (AC8) */}
      {isValidAddress && <SocialShareButtons paymentUrl={paymentUrl} />}
    </div>
  );
}
