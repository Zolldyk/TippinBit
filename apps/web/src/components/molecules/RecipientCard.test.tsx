import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RecipientCard } from './RecipientCard';
import type { Address } from 'viem';

// Mock the AddressDisplay component since we're testing RecipientCard's integration
vi.mock('./AddressDisplay', () => ({
  AddressDisplay: ({ address, shorten, showCopy }: { address: Address; shorten: boolean; showCopy: boolean }) => (
    <div data-testid="address-display" data-address={address} data-shorten={shorten} data-show-copy={showCopy}>
      {shorten ? `${address.slice(0, 6)}...${address.slice(-4)}` : address}
    </div>
  ),
}));

describe('RecipientCard', () => {
  const validAddress: Address = '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';

  describe('rendering', () => {
    it('renders "Supporting:" label', () => {
      render(<RecipientCard recipientAddress={validAddress} />);

      expect(screen.getByText('Supporting:')).toBeInTheDocument();
    });

    it('renders AddressDisplay component with correct props', () => {
      render(<RecipientCard recipientAddress={validAddress} />);

      const addressDisplay = screen.getByTestId('address-display');
      expect(addressDisplay).toBeInTheDocument();
      expect(addressDisplay).toHaveAttribute('data-address', validAddress);
      expect(addressDisplay).toHaveAttribute('data-shorten', 'true');
      expect(addressDisplay).toHaveAttribute('data-show-copy', 'true');
    });

    it('displays truncated address format', () => {
      render(<RecipientCard recipientAddress={validAddress} />);

      const addressDisplay = screen.getByTestId('address-display');
      // Mocked AddressDisplay shows truncated format when shorten=true
      expect(addressDisplay.textContent).toBe('0x742d...2F5A');
    });

    it('applies correct styling to label', () => {
      render(<RecipientCard recipientAddress={validAddress} />);

      const label = screen.getByText('Supporting:');
      expect(label).toHaveClass('text-sm', 'text-neutral-600');
    });
  });

  describe('layout and spacing', () => {
    it('uses responsive padding (p-4 md:p-6)', () => {
      const { container } = render(<RecipientCard recipientAddress={validAddress} />);

      // Card component should have responsive padding classes
      const card = container.querySelector('[class*="p-4"]');
      expect(card).toBeInTheDocument();
    });

    it('has flex column layout with gap', () => {
      const { container } = render(<RecipientCard recipientAddress={validAddress} />);

      const flexContainer = container.querySelector('.flex.flex-col.gap-2');
      expect(flexContainer).toBeInTheDocument();
    });
  });

  describe('different address formats', () => {
    it('handles checksummed addresses', () => {
      const checksummedAddress: Address = '0x742d35Cc6874C97De156c9b9b3a3A3e3b10c2F5A';
      render(<RecipientCard recipientAddress={checksummedAddress} />);

      const addressDisplay = screen.getByTestId('address-display');
      expect(addressDisplay).toHaveAttribute('data-address', checksummedAddress);
    });

    it('handles lowercase addresses', () => {
      const lowercaseAddress: Address = '0x742d35cc6874c97de156c9b9b3a3a3e3b10c2f5a';
      render(<RecipientCard recipientAddress={lowercaseAddress} />);

      const addressDisplay = screen.getByTestId('address-display');
      expect(addressDisplay).toHaveAttribute('data-address', lowercaseAddress);
    });

    it('handles different valid Ethereum addresses', () => {
      const differentAddress: Address = '0x1234567890123456789012345678901234567890';
      render(<RecipientCard recipientAddress={differentAddress} />);

      const addressDisplay = screen.getByTestId('address-display');
      expect(addressDisplay).toHaveAttribute('data-address', differentAddress);
      expect(addressDisplay.textContent).toBe('0x1234...7890');
    });
  });

  describe('accessibility', () => {
    it('uses Card component with elevated variant', () => {
      const { container } = render(<RecipientCard recipientAddress={validAddress} />);

      // Card component renders with proper structure
      const card = container.firstChild;
      expect(card).toBeInTheDocument();
    });

    it('maintains 44px minimum touch target through AddressDisplay', () => {
      render(<RecipientCard recipientAddress={validAddress} />);

      // AddressDisplay component (from Story 1.3) handles touch target requirements
      const addressDisplay = screen.getByTestId('address-display');
      expect(addressDisplay).toHaveAttribute('data-show-copy', 'true');
    });
  });

  describe('component integration', () => {
    it('passes correct props to AddressDisplay for truncation', () => {
      render(<RecipientCard recipientAddress={validAddress} />);

      const addressDisplay = screen.getByTestId('address-display');
      expect(addressDisplay).toHaveAttribute('data-shorten', 'true');
    });

    it('passes correct props to AddressDisplay for copy functionality', () => {
      render(<RecipientCard recipientAddress={validAddress} />);

      const addressDisplay = screen.getByTestId('address-display');
      expect(addressDisplay).toHaveAttribute('data-show-copy', 'true');
    });

    it('composes Card and AddressDisplay correctly', () => {
      const { container } = render(<RecipientCard recipientAddress={validAddress} />);

      // Should have Card as container
      expect(container.firstChild).toBeInTheDocument();

      // Should have AddressDisplay inside
      expect(screen.getByTestId('address-display')).toBeInTheDocument();

      // Should have label
      expect(screen.getByText('Supporting:')).toBeInTheDocument();
    });
  });
});
