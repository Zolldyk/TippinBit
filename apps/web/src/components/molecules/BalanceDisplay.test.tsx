import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { BalanceDisplay } from './BalanceDisplay';
import userEvent from '@testing-library/user-event';

// Mock window.location.reload
const mockReload = vi.fn();
Object.defineProperty(window, 'location', {
  value: { reload: mockReload },
  writable: true,
});

describe('BalanceDisplay', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('displays balance with correct format "Your MUSD balance: $15.30"', () => {
    render(<BalanceDisplay balance="15.30" isLoading={false} />);

    expect(screen.getByText(/Your MUSD balance: \$15.30/)).toBeInTheDocument();
  });

  it('shows skeleton loader while isLoading is true', () => {
    render(<BalanceDisplay balance={null} isLoading={true} />);

    // Check for skeleton loader (animated div)
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
    expect(skeleton).toHaveClass('bg-slate-200');
  });

  it('shows loading timeout error after 10 seconds with retry button', async () => {
    render(<BalanceDisplay balance={null} isLoading={true} />);

    // Initially should show skeleton
    expect(document.querySelector('.animate-pulse')).toBeInTheDocument();

    // Fast-forward 10 seconds
    vi.advanceTimersByTime(10000);

    // Should show error message
    await waitFor(() => {
      expect(
        screen.getByText(/Unable to fetch balance. Check wallet connection./)
      ).toBeInTheDocument();
    });

    // Should show retry button
    expect(
      screen.getByRole('button', { name: /Retry fetching balance/i })
    ).toBeInTheDocument();
  });

  it('calls window.location.reload when retry button is clicked', async () => {
    const user = userEvent.setup({ delay: null });
    render(<BalanceDisplay balance={null} isLoading={true} />);

    // Fast-forward to show timeout error
    vi.advanceTimersByTime(10000);

    await waitFor(() => {
      expect(
        screen.getByRole('button', { name: /Retry fetching balance/i })
      ).toBeInTheDocument();
    });

    // Click retry button
    const retryButton = screen.getByRole('button', {
      name: /Retry fetching balance/i,
    });
    await user.click(retryButton);

    // Should call window.location.reload
    expect(mockReload).toHaveBeenCalled();
  });

  it('shows zero balance with faucet link', () => {
    render(<BalanceDisplay balance="0.00" isLoading={false} />);

    expect(screen.getByText(/You have 0 MUSD/)).toBeInTheDocument();

    // Check faucet link
    const faucetLink = screen.getByRole('link', {
      name: /Get MUSD from testnet faucet/i,
    });
    expect(faucetLink).toBeInTheDocument();
    expect(faucetLink).toHaveAttribute(
      'href',
      'https://faucet.test.mezo.org'
    );
  });

  it('faucet link opens in new tab (target="_blank")', () => {
    render(<BalanceDisplay balance="0.00" isLoading={false} />);

    const faucetLink = screen.getByRole('link', {
      name: /Get MUSD from testnet faucet/i,
    });
    expect(faucetLink).toHaveAttribute('target', '_blank');
    expect(faucetLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('has proper accessibility - aria-label', () => {
    const { container } = render(
      <BalanceDisplay balance="15.30" isLoading={false} />
    );

    const displayDiv = container.querySelector('[aria-label]');
    expect(displayDiv).toHaveAttribute('aria-label', 'MUSD balance display');
  });

  it('has proper accessibility - aria-live', () => {
    const { container } = render(
      <BalanceDisplay balance="15.30" isLoading={false} />
    );

    const displayDiv = container.querySelector('[aria-live]');
    expect(displayDiv).toHaveAttribute('aria-live', 'polite');
  });

  it('renders Wallet icon correctly', () => {
    render(<BalanceDisplay balance="15.30" isLoading={false} />);

    // Lucide icons render as SVG with specific class
    const icon = document.querySelector('.lucide-wallet');
    expect(icon).toBeInTheDocument();
  });

  it('applies fade-in animation when balance loads', () => {
    const { container, rerender } = render(
      <BalanceDisplay balance={null} isLoading={true} />
    );

    // Rerender with loaded balance
    rerender(<BalanceDisplay balance="15.30" isLoading={false} />);

    // Check for opacity transition class
    const displayDiv = container.querySelector('.transition-opacity');
    expect(displayDiv).toBeInTheDocument();
    expect(displayDiv).toHaveClass('opacity-100');
  });

  it('clears timeout when component unmounts during loading', () => {
    const { unmount } = render(
      <BalanceDisplay balance={null} isLoading={true} />
    );

    // Unmount before timeout
    unmount();

    // Fast-forward past timeout
    vi.advanceTimersByTime(10000);

    // Should not throw error or show timeout message
    expect(
      screen.queryByText(/Unable to fetch balance/)
    ).not.toBeInTheDocument();
  });

  it('resets timeout when loading state changes', async () => {
    const { rerender } = render(
      <BalanceDisplay balance={null} isLoading={true} />
    );

    // Wait 5 seconds (halfway)
    vi.advanceTimersByTime(5000);

    // Change to loaded state
    rerender(<BalanceDisplay balance="15.30" isLoading={false} />);

    // Wait another 5 seconds (total 10, but timer was reset)
    vi.advanceTimersByTime(5000);

    // Should NOT show timeout error
    expect(
      screen.queryByText(/Unable to fetch balance/)
    ).not.toBeInTheDocument();
    expect(screen.getByText(/Your MUSD balance: \$15.30/)).toBeInTheDocument();
  });

  it('displays correct balance format for various amounts', () => {
    const testCases = [
      { balance: '0.01', expected: '$0.01' },
      { balance: '100.00', expected: '$100.00' },
      { balance: '1234.56', expected: '$1234.56' },
    ];

    testCases.forEach(({ balance, expected }) => {
      const { unmount } = render(
        <BalanceDisplay balance={balance} isLoading={false} />
      );
      expect(
        screen.getByText(new RegExp(`Your MUSD balance: \\${expected}`))
      ).toBeInTheDocument();
      unmount();
    });
  });

  it('handles null balance with loading false (shows skeleton)', () => {
    render(<BalanceDisplay balance={null} isLoading={false} />);

    // Should show skeleton even if not loading (null balance case)
    const skeleton = document.querySelector('.animate-pulse');
    expect(skeleton).toBeInTheDocument();
  });

  it('timeout error uses red color for visibility', () => {
    render(<BalanceDisplay balance={null} isLoading={true} />);

    vi.advanceTimersByTime(10000);

    const errorDiv = document.querySelector('.text-red-600');
    expect(errorDiv).toBeInTheDocument();
  });

  it('zero balance uses responsive layout (mobile/desktop)', () => {
    const { container } = render(
      <BalanceDisplay balance="0.00" isLoading={false} />
    );

    // Check for responsive flex classes
    const displayDiv = container.querySelector(
      '.flex-col.sm\\:flex-row'
    );
    expect(displayDiv).toBeInTheDocument();
  });
});
