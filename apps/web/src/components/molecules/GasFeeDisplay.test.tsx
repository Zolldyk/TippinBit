import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { parseEther } from 'viem';
import { GasFeeDisplay } from './GasFeeDisplay';

describe('GasFeeDisplay', () => {
  describe('Basic Rendering', () => {
    it('renders total cost with gas fee (AC4)', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('5')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      const totalCost = screen.getByText(/Total cost: ~\$5.15/);
      expect(totalCost).toBeInTheDocument();

      const networkFee = screen.getByText(/includes ~\$0.15 network fee/);
      expect(networkFee).toBeInTheDocument();
    });

    it('does not render when tip amount is zero', () => {
      const { container } = render(
        <GasFeeDisplay
          tipAmount={BigInt(0)}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });

    it('does not render when gas estimate is null', () => {
      const { container } = render(
        <GasFeeDisplay
          tipAmount={parseEther('5')}
          gasEstimateUsd={null}
          isLoading={false}
        />
      );

      expect(container.firstChild).toBeNull();
    });
  });

  describe('Loading State (AC5)', () => {
    it('shows skeleton loader while isLoading is true', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('5')}
          gasEstimateUsd="0.15"
          isLoading={true}
        />
      );

      const skeleton = screen.getByRole('status', { hidden: true });
      expect(skeleton).toHaveClass('animate-pulse');
      expect(skeleton).toHaveAttribute('aria-busy', 'true');
    });

    it('shows content when isLoading is false', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('5')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      expect(screen.queryByRole('status', { hidden: true })).not.toBeInTheDocument();
      expect(screen.getByText(/Total cost/)).toBeInTheDocument();
    });

    it('has aria-live="polite" for loading state', () => {
      const { container } = render(
        <GasFeeDisplay
          tipAmount={parseEther('5')}
          gasEstimateUsd="0.15"
          isLoading={true}
        />
      );

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });
  });

  describe('Economic Viability Warning (AC6)', () => {
    it('shows warning when tipAmount < 2x gas estimate', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.25')} // $0.25 tip
          gasEstimateUsd="0.15" // $0.15 gas (0.25 < 0.30)
          isLoading={false}
        />
      );

      const warning = screen.getByRole('alert');
      expect(warning).toBeInTheDocument();
      expect(warning).toHaveTextContent(/Network fees/);
      expect(warning).toHaveTextContent(/for better value/);
    });

    it('does not show warning when tipAmount >= 2x gas estimate', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('5')} // $5 tip
          gasEstimateUsd="0.15" // $0.15 gas (5 >= 0.30)
          isLoading={false}
        />
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('calculates exact threshold (tipAmount = 2x gas)', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.30')} // $0.30 tip
          gasEstimateUsd="0.15" // $0.15 gas (0.30 = 0.30, not uneconomical)
          isLoading={false}
        />
      );

      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('warning includes specific gas amount in message (AC6)', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.25')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      const warning = screen.getByRole('alert');
      expect(warning).toHaveTextContent(/~\$0.15/);
    });

    it('warning suggests better value amount', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.25')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      const warning = screen.getByRole('alert');
      // Should suggest $1+ for better value (ceil(0.15 * 2) = 1)
      expect(warning).toHaveTextContent(/Consider \$1\+ for better value/);
    });

    it('warning displays fee percentage', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.29')} // $0.29 tip (below $0.30 threshold)
          gasEstimateUsd="0.15" // $0.15 gas, 52% of tip
          isLoading={false}
        />
      );

      const warning = screen.getByRole('alert');
      expect(warning).toHaveTextContent(/52%/);
    });
  });

  describe('Warning Styling (AC7)', () => {
    it('warning uses amber color, not red error state', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.25')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      const warning = screen.getByRole('alert');
      expect(warning).toHaveClass('bg-amber-50');
      expect(warning).toHaveClass('border-amber-200');

      const warningText = warning.querySelector('p');
      expect(warningText).toHaveClass('text-amber-800');
    });

    it('warning icon uses amber color', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.25')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      const icon = screen.getByRole('alert').querySelector('svg');
      expect(icon).toHaveClass('text-amber-600');
    });

    it('warning allows transaction (component still renders)', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.25')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      // Warning should be visible but not blocking
      const warning = screen.getByRole('alert');
      expect(warning).toBeInTheDocument();

      // Total cost should still be displayed
      expect(screen.getByText(/Total cost/)).toBeInTheDocument();
    });
  });

  describe('Accessibility', () => {
    it('has aria-live="polite" for dynamic updates', () => {
      const { container } = render(
        <GasFeeDisplay
          tipAmount={parseEther('5')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      const liveRegion = container.querySelector('[aria-live="polite"]');
      expect(liveRegion).toBeInTheDocument();
    });

    it('warning has role="alert"', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.25')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      const warning = screen.getByRole('alert');
      expect(warning).toHaveAttribute('role', 'alert');
    });

    it('warning icon has aria-hidden', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.25')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      const icon = screen.getByRole('alert').querySelector('svg');
      expect(icon).toHaveAttribute('aria-hidden', 'true');
    });
  });

  describe('Total Cost Calculation', () => {
    it('calculates correct total cost', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('10')}
          gasEstimateUsd="0.25"
          isLoading={false}
        />
      );

      // $10 tip + $0.25 gas = $10.25 total
      expect(screen.getByText(/Total cost: ~\$10.25/)).toBeInTheDocument();
    });

    it('handles decimal tip amounts correctly', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('5.50')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      // $5.50 tip + $0.15 gas = $5.65 total
      expect(screen.getByText(/Total cost: ~\$5.65/)).toBeInTheDocument();
    });

    it('handles large amounts correctly', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('500')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      // $500 tip + $0.15 gas = $500.15 total
      expect(screen.getByText(/Total cost: ~\$500.15/)).toBeInTheDocument();
    });

    it('handles small amounts correctly', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.10')}
          gasEstimateUsd="0.15"
          isLoading={false}
        />
      );

      // $0.10 tip + $0.15 gas = $0.25 total
      expect(screen.getByText(/Total cost: ~\$0.25/)).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('handles very small gas estimates', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('5')}
          gasEstimateUsd="0.01"
          isLoading={false}
        />
      );

      expect(screen.getByText(/~\$0.01 network fee/)).toBeInTheDocument();
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles very large gas estimates', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('1')}
          gasEstimateUsd="2.50"
          isLoading={false}
        />
      );

      expect(screen.getByText(/~\$2.50 network fee/)).toBeInTheDocument();
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });

    it('handles exact economic threshold', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('1')}
          gasEstimateUsd="0.50" // Exactly 2x
          isLoading={false}
        />
      );

      // Should not show warning (1 >= 0.50 * 2)
      expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    it('handles one cent below threshold', () => {
      render(
        <GasFeeDisplay
          tipAmount={parseEther('0.99')}
          gasEstimateUsd="0.50" // 0.99 < 1.00
          isLoading={false}
        />
      );

      // Should show warning
      expect(screen.getByRole('alert')).toBeInTheDocument();
    });
  });
});
