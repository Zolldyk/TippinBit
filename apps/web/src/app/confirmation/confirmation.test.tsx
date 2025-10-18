import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TransactionConfirmationContent } from '@/components/organisms/TransactionConfirmationContent';

// Mock Next.js navigation for ReturnButton
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(() => ({
    get: vi.fn(() => null),
  })),
}));

describe('Transaction Confirmation Page - URL Parameters (Task 1)', () => {
  const mockTxHash = '0x' + '1'.repeat(64);
  const mockRecipient = '0x9aabD891ab1FaA750FAE5aba9b55623c7F69fD58' as `0x${string}`;
  const mockTimestamp = 'October 17, 2025 at 1:00 PM';

  // Mock clipboard API for CopyButton
  beforeEach(() => {
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  describe('Amount Parameter Validation', () => {
    it('displays formatted amount when valid amount parameter provided', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount="5.00"
          recipient={null}
          timestamp={mockTimestamp}
        />
      );

      // Should display "$5.00 MUSD"
      expect(screen.getByText('$5.00 MUSD')).toBeInTheDocument();
    });

    it('displays fallback text when amount not provided', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount={null}
          recipient={null}
          timestamp={mockTimestamp}
        />
      );

      // Should display fallback text
      expect(screen.getByText('Tip sent successfully')).toBeInTheDocument();
    });

    it('accepts amount with proper 2 decimal format', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount="100.99"
          recipient={null}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('$100.99 MUSD')).toBeInTheDocument();
    });
  });

  describe('Recipient Parameter Validation', () => {
    it('displays truncated recipient when valid address provided', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount={null}
          recipient={mockRecipient}
          timestamp={mockTimestamp}
        />
      );

      // Should display truncated address (first 6 + last 4 chars)
      expect(screen.getByText('Recipient')).toBeInTheDocument();
      expect(screen.getByText('0x9aab...fD58')).toBeInTheDocument();
    });

    it('hides recipient row when no recipient provided', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount={null}
          recipient={null}
          timestamp={mockTimestamp}
        />
      );

      // "Recipient" label should not appear
      expect(screen.queryByText('Recipient')).not.toBeInTheDocument();
    });
  });

  describe('Combined URL Parameters', () => {
    it('displays both amount and recipient when both valid', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount="5.00"
          recipient={mockRecipient}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('$5.00 MUSD')).toBeInTheDocument();
      expect(screen.getByText('Recipient')).toBeInTheDocument();
      expect(screen.getByText('0x9aab...fD58')).toBeInTheDocument();
    });

    it('displays amount only when recipient not provided', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount="5.00"
          recipient={null}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('$5.00 MUSD')).toBeInTheDocument();
      expect(screen.queryByText('Recipient')).not.toBeInTheDocument();
    });

    it('displays recipient only when amount not provided', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount={null}
          recipient={mockRecipient}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('Tip sent successfully')).toBeInTheDocument();
      expect(screen.getByText('Recipient')).toBeInTheDocument();
      expect(screen.getByText('0x9aab...fD58')).toBeInTheDocument();
    });
  });

  describe('Content Rendering', () => {
    it('displays success message and transaction summary', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount="5.00"
          recipient={mockRecipient}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('Your support means the world!')).toBeInTheDocument();
      expect(screen.getByText('Transaction Summary')).toBeInTheDocument();
    });

    it('displays timestamp', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount={null}
          recipient={null}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText(mockTimestamp)).toBeInTheDocument();
    });

    it('displays thank you message', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount={null}
          recipient={null}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('Thank you for your support! ❤️')).toBeInTheDocument();
    });
  });

  describe('Social Sharing Integration', () => {
    it('renders social sharing buttons', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount="5.00"
          recipient={mockRecipient}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByText('Share your support')).toBeInTheDocument();
      expect(screen.getByLabelText('Share on X (Twitter)')).toBeInTheDocument();
      expect(screen.getByLabelText('Copy link for Instagram')).toBeInTheDocument();
      expect(screen.getByLabelText('Copy link for TikTok')).toBeInTheDocument();
    });

    it('social share button includes recipient in URL when provided', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount="5.00"
          recipient={mockRecipient}
          timestamp={mockTimestamp}
        />
      );

      const twitterLink = screen.getByLabelText('Share on X (Twitter)');
      const href = twitterLink.getAttribute('href');

      expect(href).toContain(mockTxHash);
      expect(href).toContain('0x9aab...fD58'); // Truncated recipient
    });
  });

  describe('Blockchain Explorer Integration', () => {
    it('renders collapsible explorer section', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount={null}
          recipient={null}
          timestamp={mockTimestamp}
        />
      );

      expect(screen.getByLabelText('Toggle blockchain explorer details')).toBeInTheDocument();
      expect(screen.getByText('View on blockchain explorer')).toBeInTheDocument();
    });
  });

  describe('Prefers Reduced Motion', () => {
    it('applies motion-reduce classes to main container', () => {
      const { container } = render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount={null}
          recipient={null}
          timestamp={mockTimestamp}
        />
      );

      const mainDiv = container.firstChild;
      expect(mainDiv).toHaveClass('motion-reduce:transition-none');
      expect(mainDiv).toHaveClass('motion-reduce:duration-0');
    });
  });

  describe('Full Confirmation Flow', () => {
    it('renders complete confirmation page with all elements', () => {
      render(
        <TransactionConfirmationContent
          txHash={mockTxHash}
          amount="5.00"
          recipient={mockRecipient}
          timestamp={mockTimestamp}
        />
      );

      // Verify all major sections are present
      expect(screen.getByLabelText('Success checkmark')).toBeInTheDocument();
      expect(screen.getByText('Your support means the world!')).toBeInTheDocument();
      expect(screen.getByText('Transaction Summary')).toBeInTheDocument();
      expect(screen.getByText('$5.00 MUSD')).toBeInTheDocument();
      expect(screen.getByText('0x9aab...fD58')).toBeInTheDocument();
      expect(screen.getByText('Thank you for your support! ❤️')).toBeInTheDocument();
      expect(screen.getByText('Share your support')).toBeInTheDocument();
      expect(screen.getByLabelText('Toggle blockchain explorer details')).toBeInTheDocument();
      expect(screen.getByLabelText('Copy transaction hash')).toBeInTheDocument();
    });
  });
});
