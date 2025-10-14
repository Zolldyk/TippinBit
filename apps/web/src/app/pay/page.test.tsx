import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';

// Mock next/navigation for useSearchParams - MUST be before imports
const mockUseSearchParams = vi.fn();
vi.mock('next/navigation', () => ({
  useSearchParams: mockUseSearchParams,
}));

import PayPage from './page';

// Mock the validation functions
vi.mock('@/lib/validation', () => ({
  validatePaymentAddress: (addr: string) => {
    if (!addr || typeof addr !== 'string') return null;
    const ethAddressRegex = /^0x[a-fA-F0-9]{40}$/;
    if (!ethAddressRegex.test(addr)) return null;
    return addr as `0x${string}`;
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

vi.mock('@/components/organisms/PaymentForm', () => ({
  PaymentForm: ({ prefillAmount }: { prefillAmount?: number }) => (
    <div data-testid="payment-form">
      {prefillAmount ? (
        <div>${prefillAmount.toFixed(2)}</div>
      ) : (
        <div>Enter any amount</div>
      )}
    </div>
  ),
}));

describe('PayPage', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('AC1: Route parses query parameters', () => {
    it('successfully parses to and amount parameters', () => {
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return '5';
          return null;
        },
      });

      render(<PayPage />);

      // Should render the payment page (not error page)
      expect(screen.getByTestId('recipient-card')).toBeInTheDocument();
      expect(screen.queryByTestId('payment-error')).not.toBeInTheDocument();
    });

    it('handles only to parameter without amount', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          return null;
        },
      });

      render(<PayPage />);

      // Should render the payment page with empty amount placeholder
      expect(screen.getByTestId('recipient-card')).toBeInTheDocument();
      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });
  });

  describe('AC2: Wallet address validation', () => {
    it('accepts valid Ethereum address (checksummed)', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          return null;
        },
      });

      render(<PayPage />);

      const recipientCard = screen.getByTestId('recipient-card');
      expect(recipientCard).toBeInTheDocument();
      expect(recipientCard).toHaveAttribute(
        'data-address',
        '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A'
      );
    });

    it('accepts valid Ethereum address (lowercase)', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35cc6874c97de156c9b9b3a3a3e3b10c2f5a';
          return null;
        },
      });

      render(<PayPage />);

      // Should convert to checksummed format via validatePaymentAddress
      const recipientCard = screen.getByTestId('recipient-card');
      expect(recipientCard).toBeInTheDocument();
    });

    it('rejects invalid address format', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return 'invalid-address';
          return null;
        },
      });

      render(<PayPage />);

      const errorElement = screen.getByTestId('payment-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('data-error-type', 'invalid_address');
    });

    it('rejects address with wrong length', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x123'; // Too short
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByTestId('payment-error')).toBeInTheDocument();
    });
  });

  describe('AC3: Invalid address error message', () => {
    it('shows user-friendly error for invalid address', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return 'not-an-address';
          return null;
        },
      });

      render(<PayPage />);

      expect(
        screen.getByText('Invalid payment link. Please check the URL and try again.')
      ).toBeInTheDocument();
    });
  });

  describe('AC4: Amount parameter pre-fills input', () => {
    it('pre-fills amount when valid amount provided', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return '5';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('$5.00')).toBeInTheDocument();
    });

    it('formats amount with 2 decimal places', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return '10.5';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('$10.50')).toBeInTheDocument();
    });

    it('handles decimal amounts correctly', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return '0.5';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('$0.50')).toBeInTheDocument();
    });
  });

  describe('AC5: Missing amount shows placeholder', () => {
    it('shows "Enter any amount" when amount not provided', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('shows placeholder when amount is empty string', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return '';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('shows placeholder when amount is whitespace', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return '   ';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });
  });

  describe('AC6: Recipient address display', () => {
    it('renders RecipientCard with validated address', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          return null;
        },
      });

      render(<PayPage />);

      const recipientCard = screen.getByTestId('recipient-card');
      expect(recipientCard).toBeInTheDocument();
      expect(recipientCard).toHaveAttribute(
        'data-address',
        '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A'
      );
    });
  });

  describe('AC7: Missing to parameter error', () => {
    it('shows error when to parameter is missing', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: () => null,
      });

      render(<PayPage />);

      const errorElement = screen.getByTestId('payment-error');
      expect(errorElement).toBeInTheDocument();
      expect(errorElement).toHaveAttribute('data-error-type', 'missing_recipient');
      expect(
        screen.getByText(
          'This payment link is incomplete. Contact the creator for a valid link.'
        )
      ).toBeInTheDocument();
    });

    it('shows error when to parameter is empty string', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByTestId('payment-error')).toBeInTheDocument();
      expect(
        screen.getByText(
          'This payment link is incomplete. Contact the creator for a valid link.'
        )
      ).toBeInTheDocument();
    });

    it('shows error when to parameter is whitespace', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '   ';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByTestId('payment-error')).toBeInTheDocument();
    });
  });

  describe('AC8: Manual URL testing patterns', () => {
    it('loads payment page with $5.00 pre-filled for valid URL', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return '5';
          return null;
        },
      });

      render(<PayPage />);

      // Should render complete payment page
      expect(screen.getByText('Send a tip')).toBeInTheDocument();
      expect(screen.getByTestId('wallet-connector')).toBeInTheDocument();
      expect(screen.getByTestId('recipient-card')).toBeInTheDocument();
      expect(screen.getByText('$5.00')).toBeInTheDocument();
    });

    it('handles URL without amount parameter', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('Send a tip')).toBeInTheDocument();
      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('handles invalid address in URL', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return 'invalid-address';
          return null;
        },
      });

      render(<PayPage />);

      expect(
        screen.getByText('Invalid payment link. Please check the URL and try again.')
      ).toBeInTheDocument();
    });

    it('handles URL with no parameters', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: () => null,
      });

      render(<PayPage />);

      expect(
        screen.getByText(
          'This payment link is incomplete. Contact the creator for a valid link.'
        )
      ).toBeInTheDocument();
    });
  });

  describe('AC9: Creator context card display', () => {
    it('displays RecipientCard with Supporting label', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          return null;
        },
      });

      render(<PayPage />);

      const recipientCard = screen.getByTestId('recipient-card');
      expect(recipientCard.textContent).toContain('Supporting:');
      expect(recipientCard.textContent).toContain('0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A');
    });
  });

  describe('Edge cases and invalid amount handling', () => {
    it('ignores non-numeric amount parameter', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return 'abc';
          return null;
        },
      });

      render(<PayPage />);

      // Should render page but with placeholder (invalid amount ignored)
      expect(screen.getByTestId('recipient-card')).toBeInTheDocument();
      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('ignores negative amount', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return '-5';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('ignores zero amount', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return '0';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });

    it('ignores Infinity amount', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          if (key === 'amount') return 'Infinity';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('Enter any amount')).toBeInTheDocument();
    });
  });

  describe('Page structure and layout', () => {
    it('renders main heading "Send a tip"', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByText('Send a tip')).toBeInTheDocument();
    });

    it('renders WalletConnector component', () => {
      
      mockUseSearchParams.mockReturnValue({
        get: (key: string) => {
          if (key === 'to') return '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
          return null;
        },
      });

      render(<PayPage />);

      expect(screen.getByTestId('wallet-connector')).toBeInTheDocument();
    });
  });
});
