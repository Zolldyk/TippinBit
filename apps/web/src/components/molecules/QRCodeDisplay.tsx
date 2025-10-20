'use client';

import { useState, useEffect } from 'react';
import QRCode from 'qrcode';
import Image from 'next/image';
import type { QRCodeDisplayProps } from '@/types/domain';

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
 * - Accessible alt text
 */
export function QRCodeDisplay({
  paymentUrl,
  size = 300,
  showLogo = true,
  onGenerated,
}: QRCodeDisplayProps) {
  const [qrCodeDataUrl, setQrCodeDataUrl] = useState<string>('');
  const [isGenerating, setIsGenerating] = useState(false);

  useEffect(() => {
    async function generateQRCode() {
      if (!paymentUrl) {
        return;
      }

      setIsGenerating(true);
      try {
        const dataUrl = await QRCode.toDataURL(paymentUrl, {
          errorCorrectionLevel: 'H', // High (30% redundancy) - AC4
          width: size,
          margin: 2,
          color: {
            dark: '#000000', // Black modules
            light: '#FFFFFF', // White background
          },
        });

        setQrCodeDataUrl(dataUrl);
        onGenerated?.(dataUrl);
      } catch (error) {
        console.error('Failed to generate QR code:', error);
      } finally {
        setIsGenerating(false);
      }
    }

    generateQRCode();
  }, [paymentUrl, size, onGenerated]); // Auto-regenerate on change (AC2)

  if (isGenerating) {
    return (
      <div
        className="flex items-center justify-center bg-gray-50 rounded-lg"
        style={{ width: size, height: size }}
      >
        <span className="text-gray-500 text-sm">Generating QR code...</span>
      </div>
    );
  }

  if (!qrCodeDataUrl) {
    return null;
  }

  return (
    <div className="relative inline-block qr-code-container">
      {/* QR Code Image */}
      <img
        src={qrCodeDataUrl}
        alt={`QR code for ${paymentUrl}`}
        className="w-full h-auto max-w-[400px] md:w-[300px] md:h-[300px] rounded-lg"
        data-testid="qr-code-image"
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
