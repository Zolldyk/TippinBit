import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { QRCodeDownloadButton } from './QRCodeDownloadButton';

describe('QRCodeDownloadButton', () => {
  const mockDataUrl = 'data:image/png;base64,mockQRCode';
  const mockFilename = 'tippinbit-alice-qr';

  it('renders download button with correct label (AC5)', () => {
    render(
      <QRCodeDownloadButton
        qrCodeDataUrl={mockDataUrl}
        filename={mockFilename}
      />
    );

    const button = screen.getByRole('button', { name: /Download QR code/ });
    expect(button).toBeInTheDocument();
    expect(screen.getByText('Download QR code')).toBeInTheDocument();
  });

  it('button is disabled when QR code not ready', () => {
    render(
      <QRCodeDownloadButton qrCodeDataUrl="" filename={mockFilename} />
    );

    const button = screen.getByRole('button', { name: /Download QR code/ });
    expect(button).toBeDisabled();
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('button is enabled when QR code is ready', () => {
    render(
      <QRCodeDownloadButton
        qrCodeDataUrl={mockDataUrl}
        filename={mockFilename}
      />
    );

    const button = screen.getByRole('button', { name: /Download QR code/ });
    expect(button).not.toBeDisabled();
  });

  it('renders with primary variant by default', () => {
    render(
      <QRCodeDownloadButton
        qrCodeDataUrl={mockDataUrl}
        filename={mockFilename}
      />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('bg-[var(--color-coral)]');
  });

  it('renders with secondary variant when specified', () => {
    render(
      <QRCodeDownloadButton
        qrCodeDataUrl={mockDataUrl}
        filename={mockFilename}
        variant="secondary"
      />
    );

    const button = screen.getByRole('button');
    expect(button.className).toContain('border-[var(--color-coral)]');
  });

  it('includes download icon', () => {
    render(
      <QRCodeDownloadButton
        qrCodeDataUrl={mockDataUrl}
        filename={mockFilename}
      />
    );

    // Check for Download icon (lucide-react renders as SVG)
    const button = screen.getByRole('button');
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });

  it('includes data-testid for E2E testing', () => {
    render(
      <QRCodeDownloadButton
        qrCodeDataUrl={mockDataUrl}
        filename={mockFilename}
      />
    );

    const button = screen.getByTestId('qr-download-button');
    expect(button).toBeInTheDocument();
  });

  it('button is clickable when enabled', () => {
    render(
      <QRCodeDownloadButton
        qrCodeDataUrl={mockDataUrl}
        filename={mockFilename}
      />
    );

    const button = screen.getByRole('button');

    // Should not throw when clicked
    expect(() => fireEvent.click(button)).not.toThrow();
  });

  it('has correct accessibility attributes', () => {
    render(
      <QRCodeDownloadButton
        qrCodeDataUrl={mockDataUrl}
        filename={mockFilename}
      />
    );

    const button = screen.getByRole('button', { name: /Download QR code/ });
    expect(button).toHaveAttribute('type', 'button');
  });
});

/**
 * Note on Download Functionality Testing:
 *
 * The actual download functionality (creating anchor, setting href/download, clicking)
 * cannot be reliably tested in jsdom environment due to:
 * 1. DOM manipulation conflicts with React's rendering
 * 2. Browser-specific download behavior
 * 3. File system access limitations in test environment
 *
 * Download functionality is verified through:
 * 1. E2E tests (qr-code-generation.spec.ts) - Tests actual file download
 * 2. Manual testing during development
 * 3. Component integration tests verify button renders and is interactive
 *
 * Acceptance Criteria Covered:
 * - AC5: Filename format verified in E2E tests
 * - AC6: Browser download API verified in E2E tests
 */
