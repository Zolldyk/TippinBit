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

  // Story 2.12: Button now always renders regardless of balance
  it('renders when BTC balance = 0', () => {
    render(
      <TipWithBtcButton
        btcBalance={BigInt(0)}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('Tip with BTC')).toBeInTheDocument();
  });

  it('renders when BTC balance is null', () => {
    render(
      <TipWithBtcButton
        btcBalance={null}
        isDisabled={false}
        onClick={() => {}}
      />
    );

    expect(screen.getByText('Tip with BTC')).toBeInTheDocument();
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

  // Story 2.12: Tooltip now shows static message
  it('shows static tooltip message on hover', async () => {
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
      expect(screen.getByText('Borrow MUSD using your BTC as collateral', { ignore: 'span[role="tooltip"]' })).toBeInTheDocument();
    });
  });

  // Story 2.12: Button is disabled when isDisabled prop is true (for insufficient balance)
  it('is disabled when isDisabled prop is true', () => {
    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.0001')}
        isDisabled={true}
        onClick={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /Tip with BTC/i });
    expect(button).toBeDisabled();
  });

  it('shows static tooltip even when disabled', async () => {
    const user = userEvent.setup();

    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.0001')}
        isDisabled={true}
        onClick={() => {}}
      />
    );

    const button = screen.getByRole('button', { name: /Tip with BTC/i });
    await user.hover(button);

    // Wait for tooltip to appear - static message even when disabled
    await waitFor(() => {
      expect(screen.getByText('Borrow MUSD using your BTC as collateral', { ignore: 'span[role="tooltip"]' })).toBeInTheDocument();
    });
  });

  it('calls onClick handler when clicked and not disabled', async () => {
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

  it('does not call onClick handler when disabled', async () => {
    const handleClick = vi.fn();
    const user = userEvent.setup();

    render(
      <TipWithBtcButton
        btcBalance={parseEther('0.005')}
        isDisabled={true}
        onClick={handleClick}
      />
    );

    const button = screen.getByText('Tip with BTC');
    await user.click(button);

    expect(handleClick).not.toHaveBeenCalled();
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
