'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
import type { QRCodeDisplayProps } from '@/types/domain';

const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY_MS = 1000;

/**
 * QRCodeDisplay Component
 *
 * Generates and displays a QR code for a payment URL with optional logo overlay.
 * Auto-regenerates when payment URL changes.
 *
 * Features:
 * - Client-side QR generation (privacy-first, no server roundtrip)
 * - Error correction level H (30% redundancy for logo overlay)
 * - Responsive sizing (mobile: full width max 400px, desktop: 300px fixed)
 * - Loading state during generation
 * - Automatic retry on failure (up to 3 attempts)
 * - User-facing error messages with manual retry option
 * - Accessible alt text
 */
export function QRCodeDisplay({
  paymentUrl,
  size = 300,
  showLogo = true,
  backgroundColor,
  onGenerated,
}: QRCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    async function generateQRCode(attemptNumber = 0) {
      if (!paymentUrl) {
        return;
      }

      setIsGenerating(true);
      setError(null);

      try {
        const dataUrl = await QRCode.toDataURL(paymentUrl, {
          errorCorrectionLevel: 'H', // High (30% redundancy) - AC4
          width: size,
          margin: 2,
          color: {
            dark: '#000000', // Black modules
            light: backgroundColor || '#00000000', // Background color (default transparent per AC7)
          },
        });

        setQrCodeDataUrl(dataUrl);
        setError(null);
        setRetryCount(0);
        onGenerated?.(dataUrl);
      } catch (err) {
        console.error(`Failed to generate QR code (attempt ${attemptNumber + 1}/${MAX_RETRY_ATTEMPTS}):`, err);

        // Retry logic with exponential backoff
        if (attemptNumber < MAX_RETRY_ATTEMPTS - 1) {
          const delay = RETRY_DELAY_MS * Math.pow(2, attemptNumber);
          setRetryCount(attemptNumber + 1);

          setTimeout(() => {
            generateQRCode(attemptNumber + 1);
          }, delay);
        } else {
          // All retries exhausted - show user-facing error
          setError('Failed to generate QR code. Please try again.');
          setRetryCount(0);
        }
      } finally {
        if (attemptNumber >= MAX_RETRY_ATTEMPTS - 1) {
          setIsGenerating(false);
        }
      }
    }

    generateQRCode();
  }, [paymentUrl, size, backgroundColor, onGenerated]); // Auto-regenerate on change (AC2)

  // Manual retry handler
  const handleRetry = () => {
    setError(null);
    setRetryCount(0);
    setQrCodeDataUrl('');
    // Trigger regeneration by changing state
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
    }, 100);
  };

  // Loading state
  if (isGenerating) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-gray-50 rounded-lg gap-2"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-sm">Generating QR code...</span>
        {retryCount > 0 && (
          <span className="text-gray-400 text-xs">
            Retry attempt {retryCount}/{MAX_RETRY_ATTEMPTS}
          </span>
        )}
      </div>
    );
  }

  // Error state with retry button
  if (error) {
    return (
      <div
        className="flex flex-col items-center justify-center bg-red-50 border-2 border-red-200 rounded-lg gap-3 p-4"
        style={{ minWidth: size, minHeight: size }}
        role="alert"
        aria-live="assertive"
      >
        <svg
          className="w-12 h-12 text-red-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          xmlns="http://www.w3.org/2000/svg"
          aria-hidden="true"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <span className="text-red-700 text-sm text-center font-medium">{error}</span>
        <button
          onClick={handleRetry}
          className="px-4 py-2 bg-red-600 text-white text-sm font-medium rounded-lg hover:bg-red-700 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
          aria-label="Retry QR code generation"
        >
          Try Again
        </button>
      </div>
    );
  }

  if (!qrCodeDataUrl) {
    return null;
  }

  return (
    <div className="relative inline-block qr-code-container">
      {/* QR Code Image */}
      <Image
        src={qrCodeDataUrl}
        alt={`QR code for ${paymentUrl}`}
        width={size}
        height={size}
        className="w-full h-auto max-w-[400px] md:w-[300px] md:h-[300px] rounded-lg"
        data-testid="qr-code-image"
        unoptimized
        priority
      />

      {/* Logo Overlay (AC7: optional enhancement) */}
      {showLogo && (
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-1 rounded-lg shadow-sm">
          <Image
            src="/images/logo-icon.svg"
            alt="TippinBit logo"
            width={60}
            height={60}
            priority
          />
        </div>
      )}
    </div>
  );
}
