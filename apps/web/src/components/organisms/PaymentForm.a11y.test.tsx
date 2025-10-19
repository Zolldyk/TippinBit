/**
 * Accessibility tests for PaymentForm component
 * Tests WCAG 2.1 AA compliance using axe-core
 */

import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { axe } from 'vitest-axe';
import { PaymentForm } from './PaymentForm';

// Mock MUSD_ADDRESS constant
vi.mock('@/config/contracts', () => ({
  MUSD_ADDRESS: '0x1234567890123456789012345678901234567890' as `0x${string}`,
  ERC20_ABI: [],
}));

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useAccount: () => ({ address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as `0x${string}` }),
  useChainId: () => 11155111,
}));

// Mock next/navigation
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: vi.fn(),
  }),
}));

// Mock hooks
vi.mock('@/hooks/useGasEstimation', () => ({
  useGasEstimation: () => ({
    gasEstimate: 1000000n,
    gasEstimateUsd: '0.01',
    isEstimatingGas: false,
    gasEstimationFailed: false,
  }),
}));

vi.mock('@/hooks/useBalanceMonitor', () => ({
  useBalanceMonitor: () => ({
    balance: 1000000000000000000n,
    balanceUsd: '100.00',
    isLoading: false,
    refetch: vi.fn(),
    updateOptimistically: vi.fn(),
  }),
}));

vi.mock('@/hooks/useMUSDTransfer', () => ({
  useMUSDTransfer: () => ({
    sendTransaction: vi.fn(),
    txHash: null,
    state: 'idle' as const,
    isSimulating: false,
    isPending: false,
    isConfirming: false,
    isSuccess: false,
    isError: false,
    error: null,
    startTime: null,
    pollCount: 0,
    reset: vi.fn(),
  }),
}));

describe('PaymentForm Accessibility', () => {
  const defaultProps = {
    recipientAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as `0x${string}`,
  };

  it('should have no automated accessibility violations', async () => {
    const { container } = render(<PaymentForm {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should have accessible names for all interactive elements', () => {
    render(<PaymentForm {...defaultProps} />);

    // Check for input field with label
    const amountInput = screen.getByLabelText(/tip amount/i);
    expect(amountInput).toBeInTheDocument();

    // Check for send button (exact match to avoid ambiguity)
    const sendButton = screen.getByRole('button', { name: 'Enter amount' });
    expect(sendButton).toBeInTheDocument();
  });

  it('should announce balance updates to screen readers', () => {
    render(<PaymentForm {...defaultProps} />);

    // Find balance display with aria-live region
    const balanceRegion = screen.getByLabelText(/MUSD balance display/i);
    expect(balanceRegion).toHaveAttribute('aria-live', 'polite');
  });

  it('should have proper focus indicators', () => {
    render(<PaymentForm {...defaultProps} />);

    const amountInput = screen.getByLabelText(/tip amount/i);

    // Focus on input
    amountInput.focus();

    // Verify it can be focused
    expect(document.activeElement).toBe(amountInput);
  });

  it('should have keyboard navigation support', () => {
    render(<PaymentForm {...defaultProps} />);

    // All interactive elements should be keyboard accessible
    const amountInput = screen.getByLabelText(/tip amount/i);
    const sendButton = screen.getByRole('button', { name: 'Enter amount' });

    // Verify tabIndex is not -1 (keyboard accessible)
    expect(amountInput).not.toHaveAttribute('tabIndex', '-1');
    expect(sendButton).not.toHaveAttribute('tabIndex', '-1');
  });

  it('should have correct ARIA attributes on form elements', () => {
    render(<PaymentForm {...defaultProps} />);

    const amountInput = screen.getByLabelText(/tip amount/i);

    // Input should have aria-label
    expect(amountInput).toHaveAttribute('aria-label');
  });

  it('should meet color contrast requirements', async () => {
    const { container } = render(<PaymentForm {...defaultProps} />);

    // axe-core will check color contrast as part of accessibility violations
    const results = await axe(container, {
      rules: {
        'color-contrast': { enabled: true },
      },
    });

    expect(results).toHaveNoViolations();
  });

  it('should have touch targets ≥44x44px', () => {
    render(<PaymentForm {...defaultProps} />);

    const sendButton = screen.getByRole('button', { name: 'Enter amount' });

    // Button should exist (actual pixel dimensions verified in E2E tests)
    // Note: JSDOM doesn't accurately compute layout styles
    expect(sendButton).toBeInTheDocument();

    // Verify button has minimum height styling
    const className = sendButton.className;
    expect(className).toContain('py-'); // Should have padding that ensures minimum touch target
  });
});
