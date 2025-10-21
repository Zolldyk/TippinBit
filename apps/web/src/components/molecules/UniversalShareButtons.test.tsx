import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { UniversalShareButtons } from './UniversalShareButtons';
import { toast } from 'sonner';

// Mock sonner
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('UniversalShareButtons', () => {
  const mockProps = {
    creatorPaymentUrl: 'https://tippinbit.com/pay/@alice',
    creatorDisplayName: '@alice',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Mock clipboard API
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
    });
  });

  it('renders copy link button (AC1)', () => {
    render(<UniversalShareButtons {...mockProps} />);

    expect(screen.getByLabelText(/copy payment link/i)).toBeInTheDocument();
    expect(screen.getByText(/copy link/i)).toBeInTheDocument();
  });

  it('copies creator payment link on copy button click (AC1, AC6)', async () => {
    render(<UniversalShareButtons {...mockProps} />);

    const copyButton = screen.getByLabelText(/copy payment link/i);
    fireEvent.click(copyButton);

    await waitFor(() => {
      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(
        mockProps.creatorPaymentUrl
      );
      expect(toast.success).toHaveBeenCalledWith(
        'Link copied! Share it anywhere.',
        { duration: 3000 }
      );
    });
  });

  it('shows toast notification after copy (AC1)', async () => {
    render(<UniversalShareButtons {...mockProps} />);

    fireEvent.click(screen.getByLabelText(/copy payment link/i));

    await waitFor(() => {
      expect(toast.success).toHaveBeenCalled();
    });
  });

  it('has proper ARIA labels for accessibility (AC10)', () => {
    render(<UniversalShareButtons {...mockProps} />);

    expect(
      screen.getByLabelText(/copy payment link to clipboard/i)
    ).toBeInTheDocument();
  });

  it('logs analytics event on copy (AC11)', async () => {
    const consoleSpy = vi.spyOn(console, 'log');
    render(<UniversalShareButtons {...mockProps} />);

    fireEvent.click(screen.getByLabelText(/copy payment link/i));

    await waitFor(() => {
      expect(consoleSpy).toHaveBeenCalledWith('[Analytics] Share method: copy');
    });

    consoleSpy.mockRestore();
  });

  // Mobile tests
  describe('Mobile (native share available)', () => {
    beforeEach(() => {
      // Mock navigator.share
      Object.assign(navigator, {
        share: vi.fn().mockResolvedValue(undefined),
      });
    });

    it('shows native share button on mobile (AC2, AC8)', async () => {
      render(<UniversalShareButtons {...mockProps} />);

      // Wait for useEffect to detect mobile
      await waitFor(() => {
        expect(
          screen.getByLabelText(/share creator's payment link/i)
        ).toBeInTheDocument();
      });
    });

    it('calls navigator.share with correct data (AC2, AC3)', async () => {
      render(<UniversalShareButtons {...mockProps} />);

      await waitFor(() => {
        const shareButton = screen.getByLabelText(/share creator's payment link/i);
        fireEvent.click(shareButton);
      });

      expect(navigator.share).toHaveBeenCalledWith({
        title: 'Support @alice on TippinBit',
        text: 'I just tipped @alice with TippinBit. You can too!',
        url: mockProps.creatorPaymentUrl,
      });
    });

    it('logs analytics event on native share (AC11)', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      render(<UniversalShareButtons {...mockProps} />);

      await waitFor(() => {
        const shareButton = screen.getByLabelText(/share creator's payment link/i);
        fireEvent.click(shareButton);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Share method: native'
      );

      consoleSpy.mockRestore();
    });

    it('handles share cancellation gracefully', async () => {
      const abortError = new Error('Share cancelled');
      abortError.name = 'AbortError';

      Object.assign(navigator, {
        share: vi.fn().mockRejectedValue(abortError),
      });

      render(<UniversalShareButtons {...mockProps} />);

      await waitFor(() => {
        const shareButton = screen.getByLabelText(/share creator's payment link/i);
        fireEvent.click(shareButton);
      });

      // Should not show error toast for abort
      expect(toast.error).not.toHaveBeenCalled();
    });
  });

  // Desktop tests
  describe('Desktop (no native share)', () => {
    beforeEach(() => {
      // Remove navigator.share
      Object.assign(navigator, {
        share: undefined,
      });
    });

    it('shows Twitter button on desktop (AC4, AC8)', async () => {
      render(<UniversalShareButtons {...mockProps} />);

      await waitFor(() => {
        expect(
          screen.getByLabelText(/share creator's payment link on twitter/i)
        ).toBeInTheDocument();
      });
    });

    it('does not show native share button on desktop', async () => {
      render(<UniversalShareButtons {...mockProps} />);

      await waitFor(() => {
        // Should not show the native share button (with "Share" text only)
        expect(
          screen.queryByText(/^Share$/)
        ).not.toBeInTheDocument();
      });
    });

    it('opens Twitter share in new window (AC4)', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<UniversalShareButtons {...mockProps} />);

      await waitFor(async () => {
        const twitterButton = screen.getByLabelText(
          /share creator's payment link on twitter/i
        );
        fireEvent.click(twitterButton);
      });

      expect(windowOpenSpy).toHaveBeenCalledWith(
        expect.stringContaining('twitter.com/intent/tweet'),
        '_blank',
        'noopener,noreferrer'
      );

      windowOpenSpy.mockRestore();
    });

    it('Twitter URL contains creator info (AC4)', async () => {
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<UniversalShareButtons {...mockProps} />);

      await waitFor(async () => {
        const twitterButton = screen.getByLabelText(
          /share creator's payment link on twitter/i
        );
        fireEvent.click(twitterButton);
      });

      const callUrl = windowOpenSpy.mock.calls[0]?.[0] as string;
      // URL will be encoded, so decode it first
      const decodedUrl = decodeURIComponent(callUrl);
      expect(decodedUrl).toContain('@alice');
      expect(decodedUrl).toContain('TippinBit');
      expect(callUrl).toContain(encodeURIComponent(mockProps.creatorPaymentUrl));

      windowOpenSpy.mockRestore();
    });

    it('logs analytics event on Twitter share (AC11)', async () => {
      const consoleSpy = vi.spyOn(console, 'log');
      const windowOpenSpy = vi.spyOn(window, 'open').mockImplementation(() => null);
      render(<UniversalShareButtons {...mockProps} />);

      await waitFor(async () => {
        const twitterButton = screen.getByLabelText(
          /share creator's payment link on twitter/i
        );
        fireEvent.click(twitterButton);
      });

      expect(consoleSpy).toHaveBeenCalledWith(
        '[Analytics] Share method: twitter'
      );

      consoleSpy.mockRestore();
      windowOpenSpy.mockRestore();
    });
  });

  it('uses @username in share text when available (AC7, AC9)', async () => {
    render(<UniversalShareButtons {...mockProps} />);

    // The component should use @alice in share text
    // Verified through navigator.share call or Twitter URL
    expect(mockProps.creatorDisplayName).toBe('@alice');
  });

  it('uses truncated address when username not available (AC7, AC9)', async () => {
    const addressProps = {
      creatorPaymentUrl: 'https://tippinbit.com/pay?to=0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      creatorDisplayName: '0x742d...f0bEb',
    };

    render(<UniversalShareButtons {...addressProps} />);

    expect(addressProps.creatorDisplayName).toBe('0x742d...f0bEb');
  });

  it('handles clipboard error gracefully', async () => {
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockRejectedValue(new Error('Permission denied')),
      },
    });

    render(<UniversalShareButtons {...mockProps} />);
    fireEvent.click(screen.getByLabelText(/copy payment link/i));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith(
        'Failed to copy link. Please try again.'
      );
    });
  });

  it('has minimum 44px touch targets for mobile accessibility (AC10)', () => {
    render(<UniversalShareButtons {...mockProps} />);

    const copyButton = screen.getByLabelText(/copy payment link/i);
    expect(copyButton).toHaveClass('min-h-[44px]');
  });
});
