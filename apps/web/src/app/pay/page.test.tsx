import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PayPage from './page';
import type { Address } from 'viem';

// Mock the validation functions
vi.mock('@/lib/validation', () => ({
  validatePaymentAddress: (addr: string): Address | null => {
    // Simple mock implementation that validates basic Ethereum address format
    if (!addr || typeof addr !== 'string') return null;
    // Check if it starts with 0x and has 40 hex characters after
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(addr)) return null;
    // Return the address as-is (in real code, viem would return checksummed)
    return addr as Address;
  },
  parsePaymentAmount: (amountStr?: string): number | undefined => {
    if (!amountStr || amountStr.trim() === '') {
      return undefined;
    }
    const parsed = parseFloat(amountStr);
    if (isNaN(parsed) || !Number.isFinite(parsed) || parsed <= 0) {
      return undefined;
    }
    return parsed;
  },
}));

// Mock the components used by PayPage
vi.mock('@/components/organisms/WalletConnector', () => ({
  WalletConnector: () => <div data-testid="wallet-connector">WalletConnector</div>,
}));

vi.mock('@/components/organisms/PaymentError', () => ({
  PaymentError: ({ errorType, message }: { errorType: string; message: string }) => (
    <div data-testid="payment-error" data-error-type={errorType}>
      {message}
    </div>
  ),
}));

vi.mock('@/components/molecules/RecipientCard', () => ({
  RecipientCard: ({ recipientAddress }: { recipientAddress: string }) => (
    <div data-testid="recipient-card" data-address={recipientAddress}>
      Supporting: {recipientAddress}
    </div>
  ),
}));

vi.mock('@/components/atoms/Card', () => ({
  Card: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="card" className={className}>
      {children}
    </div>
  ),
}));

describe('PayPage', () => {
  describe('AC1: Route parses query parameters', () => {
    it('successfully parses to and amount parameters', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: '5',
      });

      const { container } = render(await PayPage({ searchParams }));

      // Should render the payment page (not error page)
      expect(screen.getByTestId('recipient-card')).toBeInTheDocument();
      expect(screen.queryByTestId('payment-error')).not.toBeInTheDocument();
    });

    it('handles only to parameter without amount', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
      });

      render(await PayPage({ searchParams }));

      // Should render the payment page with empty amount placeholder
      expect(screen.getByTestId('recipient-card')).toBeInTheDocument();
      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });
  });

  describe('AC2: Wallet address validation', () => {
    it('accepts valid Ethereum address (checksummed)', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
      });

      render(await PayPage({ searchParams }));

      const recipientCard = screen.getByTestId('recipient-card');
      expect(recipientCard).toBeInTheDocument();
      expect(recipientCard).toHaveAttribute(
        'data-address',
        '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A'
      );
    });

    it('accepts valid Ethereum address (lowercase)', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35cc6874c97de156c9b9b3a3a3e3b10c2f5a',
      });

      render(await PayPage({ searchParams }));

      // Should convert to checksummed format via validatePaymentAddress
      const recipientCard = screen.getByTestId('recipient-card');
      expect(recipientCard).toBeInTheDocument();
    });

    it('rejects invalid address format', async () => {
      const searchParams = Promise.resolve({
        to: 'invalid-address',
      });

      render(await PayPage({ searchParams }));

      const errorElement = screen.getByTestId('payment-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('data-error-type', 'invalid_address');
    });

    it('rejects address with wrong length', async () => {
      const searchParams = Promise.resolve({
        to: '0x123', // Too short
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByTestId('payment-error')).toBeInTheDocument();
    });
  });

  describe('AC3: Invalid address error message', () => {
    it('shows user-friendly error for invalid address', async () => {
      const searchParams = Promise.resolve({
        to: 'not-an-address',
      });

      render(await PayPage({ searchParams }));

      expect(
        screen.getByText('Invalid payment link. Please check the URL and try again.')
      ).toBeInTheDocument();
    });
  });

  describe('AC4: Amount parameter pre-fills input', () => {
    it('pre-fills amount when valid amount provided', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: '5',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('$5.00')).toBeInTheDocument();
    });

    it('formats amount with 2 decimal places', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: '10.5',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('$10.50')).toBeInTheDocument();
    });

    it('handles decimal amounts correctly', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: '0.5',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('$0.50')).toBeInTheDocument();
    });
  });

  describe('AC5: Missing amount shows placeholder', () => {
    it('shows "Enter any amount" when amount not provided', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('shows placeholder when amount is empty string', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: '',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('shows placeholder when amount is whitespace', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: '   ',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });
  });

  describe('AC6: Recipient address display', () => {
    it('renders RecipientCard with validated address', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
      });

      render(await PayPage({ searchParams }));

      const recipientCard = screen.getByTestId('recipient-card');
      expect(recipientCard).toBeInTheDocument();
      expect(recipientCard).toHaveAttribute(
        'data-address',
        '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A'
      );
    });
  });

  describe('AC7: Missing to parameter error', () => {
    it('shows error when to parameter is missing', async () => {
      const searchParams = Promise.resolve({});

      render(await PayPage({ searchParams }));

      const errorElement = screen.getByTestId('payment-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('data-error-type', 'missing_recipient');
      expect(
        screen.getByText(
          'This payment link is incomplete. Contact the creator for a valid link.'
        )
      ).toBeInTheDocument();
    });

    it('shows error when to parameter is empty string', async () => {
      const searchParams = Promise.resolve({
        to: '',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByTestId('payment-error')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This payment link is incomplete. Contact the creator for a valid link.'
        )
      ).toBeInTheDocument();
    });

    it('shows error when to parameter is whitespace', async () => {
      const searchParams = Promise.resolve({
        to: '   ',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByTestId('payment-error')).toBeInTheDocument();
    });
  });

  describe('AC8: Manual URL testing patterns', () => {
    it('loads payment page with $5.00 pre-filled for valid URL', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: '5',
      });

      render(await PayPage({ searchParams }));

      // Should render complete payment page
      expect(screen.getByText('Send a tip')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-connector')).toBeInTheDocument();
      expect(screen.getByTestId('recipient-card')).toBeInTheDocument();
      expect(screen.getByText('$5.00')).toBeInTheDocument();
    });

    it('handles URL without amount parameter', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('Send a tip')).toBeInTheDocument();
      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('handles invalid address in URL', async () => {
      const searchParams = Promise.resolve({
        to: 'invalid-address',
      });

      render(await PayPage({ searchParams }));

      expect(
        screen.getByText('Invalid payment link. Please check the URL and try again.')
      ).toBeInTheDocument();
    });

    it('handles URL with no parameters', async () => {
      const searchParams = Promise.resolve({});

      render(await PayPage({ searchParams }));

      expect(
        screen.getByText(
          'This payment link is incomplete. Contact the creator for a valid link.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('AC9: Creator context card display', () => {
    it('displays RecipientCard with Supporting label', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
      });

      render(await PayPage({ searchParams }));

      const recipientCard = screen.getByTestId('recipient-card');
      expect(recipientCard.textContent).toContain('Supporting:');
      expect(recipientCard.textContent).toContain('0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A');
    });
  });

  describe('Edge cases and invalid amount handling', () => {
    it('ignores non-numeric amount parameter', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: 'abc',
      });

      render(await PayPage({ searchParams }));

      // Should render page but with placeholder (invalid amount ignored)
      expect(screen.getByTestId('recipient-card')).toBeInTheDocument();
      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('ignores negative amount', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: '-5',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('ignores zero amount', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: '0',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('ignores Infinity amount', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
        amount: 'Infinity',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });
  });

  describe('Page structure and layout', () => {
    it('renders main heading "Send a tip"', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('Send a tip')).toBeInTheDocument();
    });

    it('renders WalletConnector component', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByTestId('wallet-connector')).toBeInTheDocument();
    });

    it('renders Story 1.5 placeholder message', async () => {
      const searchParams = Promise.resolve({
        to: '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A',
      });

      render(await PayPage({ searchParams }));

      expect(screen.getByText('Amount input coming in Story 1.5')).toBeInTheDocument();
    });
  });
});
