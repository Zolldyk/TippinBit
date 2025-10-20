'use client';

import { Download } from 'lucide-react';
import { Button } from './Button';
import type { QRCodeDownloadButtonProps } from '@/types/domain';

/**
 * QRCodeDownloadButton Component
 *
 * Downloads QR code as PNG file using browser download API (no server upload).
 *
 * Features:
 * - Client-side download (privacy-first)
 * - Proper MIME type and filename
 * - Download icon for visual clarity
 * - Disabled state when QR code not ready
 *
 * Filename format: tippinbit-{username|address}-qr.png
 */
export function QRCodeDownloadButton({
  qrCodeDataUrl,
  filename,
  variant = 'primary',
}: QRCodeDownloadButtonProps) {
  const handleDownload = () => {
    if (!qrCodeDataUrl) {
      return;
    }

    // Create anchor element for download (AC6: browser API)
    const link = document.createElement('a');
    link.href = qrCodeDataUrl;
    link.download = `${filename}.png`; // AC5: filename format

    // Trigger download
    document.body.appendChild(link);
    link.click();

    // Clean up
    document.body.removeChild(link);
  };

  return (
    <Button
      onClick={handleDownload}
      variant={variant}
      disabled={!qrCodeDataUrl}
      className="flex items-center gap-2"
      data-testid="qr-download-button"
    >
      <Download className="w-4 h-4" />
      Download QR code
    </Button>
  );
}
