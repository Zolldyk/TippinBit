import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, it, expect, vi } from 'vitest';
import { TipWithBtcButton } from './TipWithBtcButton';
import { parseEther } from 'viem';

describe('TipWithBtcButton', () => {
  it('renders when BTC balance > 0', () => {
    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.005')}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('Tip with BTC')).toBeInTheDocument();
  });

  it('does not render when BTC balance = 0', () => {
    render(
      <TipWithBtcButton
        btcBalance={BigInt(0)}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    expect(screen.queryByText('Tip with BTC')).not.toBeInTheDocument();
  });

  it('does not render when BTC balance is null', () => {
    render(
      <TipWithBtcButton
        btcBalance={null}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    expect(screen.queryByText('Tip with BTC')).not.toBeInTheDocument();
  });

  it('shows correct label "Tip with BTC"', () => {
    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.005')}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('Tip with BTC')).toBeInTheDocument();
  });

  it('applies amber outline styling', () => {
    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.005')}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /Tip with BTC/i });
    expect(button).toHaveClass('border-amber-400');
    expect(button).toHaveClass('text-amber-600');
  });

  it('shows tooltip on hover with borrowing explanation', async () => {
    const user = userEvent.setup();

    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.005')}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /Tip with BTC/i });
    await user.hover(button);

    // Wait for tooltip to appear - query all text including hidden
    await waitFor(() => {
      expect(screen.getByText(/Borrow MUSD using your BTC as collateral/i, { ignore: 'span[role="tooltip"]' })).toBeInTheDocument();
    });
  });

  it('is disabled when BTC < minimum required', () => {
    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.0001')}
        isDisabled={true}
        onClick={() => {}}
        minimumBtcRequired="0.0043"
      />
    );

    const button = screen.getByRole('button', { name: /Tip with BTC/i });
    expect(button).toBeDisabled();
  });

  it('disabled tooltip shows minimum amount message', async () => {
    const user = userEvent.setup();

    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.0001')}
        isDisabled={true}
        onClick={() => {}}
        minimumBtcRequired="0.000043"
      />
    );

    const button = screen.getByRole('button', { name: /Tip with BTC/i });
    await user.hover(button);

    // Wait for tooltip to appear - query all text including hidden
    await waitFor(() => {
      expect(screen.getByText(/Minimum 0.000043 BTC required for borrowing/i, { ignore: 'span[role="tooltip"]' })).toBeInTheDocument();
    });
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.005')}
        isDisabled={false}
        onClick={handleClick}
      />
    );

    const button = screen.getByText('Tip with BTC');
    await user.click(button);

    expect(handleClick).toHaveBeenCalledOnce();
  });

  it('has Info icon displayed', () => {
    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.005')}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    // Check if Info icon is present (lucide-react renders as svg)
    const button = screen.getByRole('button', { name: /Tip with BTC/i });
    const svg = button.querySelector('svg');
    expect(svg).toBeInTheDocument();
  });
});
