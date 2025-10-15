import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import { InsufficientBalanceWarning } from './InsufficientBalanceWarning';
import userEvent from '@testing-library/user-event';

describe('InsufficientBalanceWarning', () => {
  beforeEach(() => {
    // Clear any previous renders
  });

  it('displays warning message with balance amount from props', () => {
    render(<InsufficientBalanceWarning balance="12.00" />);

    expect(
      screen.getByText(
        /You have \$12.00 MUSD. Reduce amount or try 'Tip with BTC' option./
      )
    ).toBeInTheDocument();
  });

  it('uses orange/amber styling (amber background, orange text)', () => {
    const { container } = render(
      <InsufficientBalanceWarning balance="12.00" />
    );

    // Check for amber background and text colors
    const warningDiv = container.querySelector('.bg-amber-50');
    expect(warningDiv).toBeInTheDocument();
    expect(warningDiv).toHaveClass('text-amber-700');
    expect(warningDiv).toHaveClass('border-coral-500');
  });

  it('renders faucet link with correct URL', () => {
    render(<InsufficientBalanceWarning balance="12.00" />);

    const faucetLink = screen.getByRole('link', {
      name: /Get MUSD from testnet faucet/i,
    });
    expect(faucetLink).toBeInTheDocument();
    expect(faucetLink).toHaveAttribute(
      'href',
      'https://faucet.test.mezo.org'
    );
    expect(faucetLink).toHaveAttribute('target', '_blank');
    expect(faucetLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders "Tip with BTC" link with "Coming soon" tooltip', async () => {
    render(<InsufficientBalanceWarning balance="12.00" />);

    const btcButton = screen.getByRole('button', {
      name: /Use Tip with BTC instead/i,
    });
    expect(btcButton).toBeInTheDocument();
  });

  it('shows "Coming soon" tooltip on BTC button hover', async () => {
    const user = userEvent.setup();
    render(<InsufficientBalanceWarning balance="12.00" />);

    const btcButton = screen.getByRole('button', {
      name: /Use Tip with BTC instead/i,
    });

    // Hover over button
    await user.hover(btcButton);

    await waitFor(() => {
      expect(screen.getByText(/Coming soon/)).toBeInTheDocument();
    });
  });

  it('hides tooltip on mouse leave', async () => {
    const user = userEvent.setup();
    render(<InsufficientBalanceWarning balance="12.00" />);

    const btcButton = screen.getByRole('button', {
      name: /Use Tip with BTC instead/i,
    });

    // Hover and then unhover
    await user.hover(btcButton);
    await waitFor(() => {
      expect(screen.getByText(/Coming soon/)).toBeInTheDocument();
    });

    await user.unhover(btcButton);
    await waitFor(() => {
      expect(screen.queryByText(/Coming soon/)).not.toBeInTheDocument();
    });
  });

  it('has proper accessibility - role="alert"', () => {
    const { container } = render(
      <InsufficientBalanceWarning balance="12.00" />
    );

    const warningDiv = container.querySelector('[role="alert"]');
    expect(warningDiv).toBeInTheDocument();
  });

  it('has proper accessibility - aria-live="assertive"', () => {
    const { container } = render(
      <InsufficientBalanceWarning balance="12.00" />
    );

    const warningDiv = container.querySelector('[aria-live="assertive"]');
    expect(warningDiv).toBeInTheDocument();
  });

  it('renders AlertCircle icon correctly', () => {
    const { container } = render(<InsufficientBalanceWarning balance="12.00" />);

    // Lucide icons render as SVG
    const icon = container.querySelector('svg');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveClass('text-amber-600');
  });

  it('icon has proper color (amber-600)', () => {
    const { container } = render(
      <InsufficientBalanceWarning balance="12.00" />
    );

    const icon = container.querySelector('.text-amber-600');
    expect(icon).toBeInTheDocument();
  });

  it('icon has aria-hidden for accessibility', () => {
    const { container } = render(
      <InsufficientBalanceWarning balance="12.00" />
    );

    const icon = container.querySelector('[aria-hidden="true"]');
    expect(icon).toBeInTheDocument();
  });

  it('applies slide-down animation on mount', async () => {
    const { container } = render(
      <InsufficientBalanceWarning balance="12.00" />
    );

    // Check for transition class
    const warningDiv = container.querySelector('.transition-all');
    expect(warningDiv).toBeInTheDocument();
    expect(warningDiv).toHaveClass('duration-200');

    // After mount, should have translate-y-0 and opacity-100
    await waitFor(() => {
      expect(warningDiv).toHaveClass('translate-y-0');
      expect(warningDiv).toHaveClass('opacity-100');
    });
  });

  it('uses responsive layout (mobile stacks, desktop inline)', () => {
    const { container } = render(
      <InsufficientBalanceWarning balance="12.00" />
    );

    // Check for responsive flex classes
    const contentDiv = container.querySelector('.flex-col.sm\\:flex-row');
    expect(contentDiv).toBeInTheDocument();
  });

  it('faucet link has focus visible styling', () => {
    render(<InsufficientBalanceWarning balance="12.00" />);

    const faucetLink = screen.getByRole('link', {
      name: /Get MUSD from testnet faucet/i,
    });
    expect(faucetLink).toHaveClass('focus-visible:ring-2');
    expect(faucetLink).toHaveClass('focus-visible:ring-coral-500');
  });

  it('BTC button has focus visible styling', () => {
    render(<InsufficientBalanceWarning balance="12.00" />);

    const btcButton = screen.getByRole('button', {
      name: /Use Tip with BTC instead/i,
    });
    expect(btcButton).toHaveClass('focus-visible:ring-2');
    expect(btcButton).toHaveClass('focus-visible:ring-coral-500');
  });

  it('shows tooltip on BTC button focus (keyboard navigation)', async () => {
    const user = userEvent.setup();
    render(<InsufficientBalanceWarning balance="12.00" />);

    // Tab to BTC button
    await user.tab();
    await user.tab(); // First tab goes to faucet link, second to BTC button

    await waitFor(() => {
      expect(screen.getByText(/Coming soon/)).toBeInTheDocument();
    });
  });

  it('handles different balance amounts correctly', () => {
    const testCases = ['0.50', '100.00', '1234.56'];

    testCases.forEach((balance) => {
      const { unmount } = render(
        <InsufficientBalanceWarning balance={balance} />
      );
      expect(
        screen.getByText(new RegExp(`You have \\$${balance} MUSD`))
      ).toBeInTheDocument();
      unmount();
    });
  });

  it('links use coral color scheme', () => {
    const { container } = render(
      <InsufficientBalanceWarning balance="12.00" />
    );

    const links = container.querySelectorAll('.text-coral-500');
    expect(links.length).toBeGreaterThan(0);
  });

  it('warning message uses medium font weight', () => {
    const { container } = render(
      <InsufficientBalanceWarning balance="12.00" />
    );

    const messageP = container.querySelector('.font-medium');
    expect(messageP).toBeInTheDocument();
    expect(messageP?.textContent).toContain('You have $12.00 MUSD');
  });

  it('suggested actions section has proper spacing', () => {
    const { container } = render(
      <InsufficientBalanceWarning balance="12.00" />
    );

    // Check for gap classes in actions section
    const actionsDiv = container.querySelector('.flex-col.sm\\:flex-wrap');
    expect(actionsDiv).toBeInTheDocument();
    expect(actionsDiv).toHaveClass('gap-2');
  });

  it('tooltip has proper z-index for visibility', async () => {
    const user = userEvent.setup();
    render(<InsufficientBalanceWarning balance="12.00" />);

    const btcButton = screen.getByRole('button', {
      name: /Use Tip with BTC instead/i,
    });

    await user.hover(btcButton);

    await waitFor(() => {
      const tooltip = screen.getByText(/Coming soon/);
      expect(tooltip).toHaveClass('z-10');
    });
  });

  it('tooltip has role="tooltip" attribute', async () => {
    const user = userEvent.setup();
    render(<InsufficientBalanceWarning balance="12.00" />);

    const btcButton = screen.getByRole('button', {
      name: /Use Tip with BTC instead/i,
    });

    await user.hover(btcButton);

    await waitFor(() => {
      const tooltip = screen.getByRole('tooltip');
      expect(tooltip).toBeInTheDocument();
    });
  });
});
