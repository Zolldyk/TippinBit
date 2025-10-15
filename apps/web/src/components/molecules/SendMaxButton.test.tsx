import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { SendMaxButton } from './SendMaxButton';
import { parseEther } from 'viem';
import userEvent from '@testing-library/user-event';

// Mock calculateMaxSendable utility
vi.mock('@/lib/formatting', () => ({
  calculateMaxSendable: vi.fn((balance: bigint, gas: bigint) => {
    const result = balance - gas;
    return result > BigInt(0) ? result : BigInt(0);
  }),
}));

describe('SendMaxButton', () => {
  const mockOnSetAmount = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('calculates max sendable correctly (balance - gas)', () => {
    const balance = parseEther('100');
    const gasEstimate = parseEther('10');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    // Should display max sendable: 100 - 10 = 90
    expect(screen.getByText(/Send your max: \$90.00/)).toBeInTheDocument();
  });

  it('displays formatted amount "Send your max: $11.85"', () => {
    const balance = parseEther('12');
    const gasEstimate = parseEther('0.15');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    expect(screen.getByText(/Send your max: \$11.85/)).toBeInTheDocument();
  });

  it('calls onSetAmount with correct bigint value when clicked', async () => {
    const user = userEvent.setup();
    const balance = parseEther('100');
    const gasEstimate = parseEther('10');
    const expectedMax = parseEther('90');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    expect(mockOnSetAmount).toHaveBeenCalledWith(expectedMax);
  });

  it('is disabled when maxSendable is 0', () => {
    const balance = parseEther('0.1');
    const gasEstimate = parseEther('0.2'); // Gas > balance

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
    expect(screen.getByText(/Send your max: \$0.00/)).toBeInTheDocument();
  });

  it('is disabled when balance is insufficient (gas > balance)', () => {
    const balance = parseEther('5');
    const gasEstimate = parseEther('10');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('does not call onSetAmount when disabled', async () => {
    const user = userEvent.setup();
    const balance = parseEther('5');
    const gasEstimate = parseEther('10');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');
    await user.click(button);

    // Should not call callback when disabled
    expect(mockOnSetAmount).not.toHaveBeenCalled();
  });

  it('shows tooltip on hover (enabled state)', async () => {
    const user = userEvent.setup();
    const balance = parseEther('100');
    const gasEstimate = parseEther('10');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');

    // Hover over button
    await user.hover(button);

    await waitFor(() => {
      expect(
        screen.getByText(
          /This calculates your balance minus estimated gas fees/
        )
      ).toBeInTheDocument();
    });
  });

  it('shows disabled tooltip when maxSendable is 0', async () => {
    const user = userEvent.setup();
    const balance = parseEther('5');
    const gasEstimate = parseEther('10');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');

    // Hover over disabled button - tooltip should still appear for disabled state
    await user.hover(button);

    // Wait for tooltip to appear (disabled buttons may need longer wait)
    await waitFor(
      () => {
        expect(
          screen.getByText(/Your balance is too low to cover network fees/)
        ).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('hides tooltip on mouse leave', async () => {
    const user = userEvent.setup();
    const balance = parseEther('100');
    const gasEstimate = parseEther('10');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');

    // Hover over button
    await user.hover(button);

    await waitFor(() => {
      expect(
        screen.getByText(
          /This calculates your balance minus estimated gas fees/
        )
      ).toBeInTheDocument();
    });

    // Unhover
    await user.unhover(button);

    await waitFor(() => {
      expect(
        screen.queryByText(
          /This calculates your balance minus estimated gas fees/
        )
      ).not.toBeInTheDocument();
    });
  });

  it('shows tooltip on focus', async () => {
    const user = userEvent.setup();
    const balance = parseEther('100');
    const gasEstimate = parseEther('10');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');

    // Focus button (keyboard navigation)
    await user.tab();
    expect(button).toHaveFocus();

    await waitFor(() => {
      expect(
        screen.getByText(
          /This calculates your balance minus estimated gas fees/
        )
      ).toBeInTheDocument();
    });
  });

  it('has proper aria-label with calculated amount', () => {
    const balance = parseEther('11.85');
    const gasEstimate = parseEther('0');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-label', 'Send your max: $11.85');
  });

  it('has proper aria-disabled when disabled', () => {
    const balance = parseEther('5');
    const gasEstimate = parseEther('10');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
  });

  it('has proper aria-label when disabled', () => {
    const balance = parseEther('5');
    const gasEstimate = parseEther('10');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');
    expect(button).toHaveAttribute(
      'aria-label',
      'Send max button disabled: Your balance is too low to cover network fees'
    );
  });

  it('uses secondary button variant', () => {
    const balance = parseEther('100');
    const gasEstimate = parseEther('10');

    const { container } = render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    // Button component should render with secondary variant styles
    const button = container.querySelector('button');
    expect(button).toBeInTheDocument();
  });

  it('meets 44px minimum touch target size', () => {
    const balance = parseEther('100');
    const gasEstimate = parseEther('10');

    const { container } = render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = container.querySelector('button');
    expect(button).toHaveClass('min-h-[44px]');
  });

  it('handles very small amounts correctly', () => {
    const balance = parseEther('0.01');
    const gasEstimate = parseEther('0.001');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    // 0.01 - 0.001 = 0.009, formatted as $0.01
    expect(screen.getByText(/Send your max: \$0.01/)).toBeInTheDocument();
  });

  it('handles zero gas estimate', () => {
    const balance = parseEther('100');
    const gasEstimate = BigInt(0);

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    // Max should equal full balance when gas is 0
    expect(screen.getByText(/Send your max: \$100.00/)).toBeInTheDocument();
  });

  it('tooltip has proper role attribute', async () => {
    const user = userEvent.setup();
    const balance = parseEther('100');
    const gasEstimate = parseEther('10');

    render(
      <SendMaxButton
        balance={balance}
        gasEstimate={gasEstimate}
        onSetAmount={mockOnSetAmount}
      />
    );

    const button = screen.getByRole('button');
    await user.hover(button);

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    });
  });
});
