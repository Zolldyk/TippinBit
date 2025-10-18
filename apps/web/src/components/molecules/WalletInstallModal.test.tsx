import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WalletInstallModal } from './WalletInstallModal';

describe('WalletInstallModal', () => {
  const mockOnClose = vi.fn();

  beforeEach(() => {
    mockOnClose.mockClear();
  });

  it('does not render when isOpen is false', () => {
    const { container } = render(
      <WalletInstallModal isOpen={false} onClose={mockOnClose} />
    );

    expect(container.firstChild).toBeNull();
  });

  it('renders when isOpen is true', () => {
    render(<WalletInstallModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('Install a wallet to continue')).toBeInTheDocument();
  });

  it('displays wallet download links on desktop', () => {
    // Mock desktop user agent
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',
      },
      writable: true,
      configurable: true,
    });

    render(<WalletInstallModal isOpen={true} onClose={mockOnClose} />);

    expect(screen.getByText('MetaMask')).toBeInTheDocument();
    expect(screen.getByText('Coinbase Wallet')).toBeInTheDocument();
    expect(screen.getByText('Rainbow')).toBeInTheDocument();
  });

  it('wallet links open in new tab with security attributes', () => {
    render(<WalletInstallModal isOpen={true} onClose={mockOnClose} />);

    const metamaskLink = screen.getByRole('link', { name: /MetaMask/i });

    expect(metamaskLink).toHaveAttribute('href', 'https://metamask.io/download/');
    expect(metamaskLink).toHaveAttribute('target', '_blank');
    expect(metamaskLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('calls onClose when close button is clicked', async () => {
    const user = userEvent.setup();
    render(<WalletInstallModal isOpen={true} onClose={mockOnClose} />);

    const closeButton = screen.getByRole('button', { name: 'Close modal' });
    await user.click(closeButton);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('calls onClose when backdrop is clicked', async () => {
    const user = userEvent.setup();
    render(<WalletInstallModal isOpen={true} onClose={mockOnClose} />);

    const backdrop = screen.getByRole('dialog');
    await user.click(backdrop);

    expect(mockOnClose).toHaveBeenCalledTimes(1);
  });

  it('does not close when modal content is clicked', async () => {
    const user = userEvent.setup();
    render(<WalletInstallModal isOpen={true} onClose={mockOnClose} />);

    const title = screen.getByText('Install a wallet to continue');
    await user.click(title);

    expect(mockOnClose).not.toHaveBeenCalled();
  });

  it('has accessible ARIA attributes', () => {
    render(<WalletInstallModal isOpen={true} onClose={mockOnClose} />);

    const dialog = screen.getByRole('dialog');
    expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(dialog).toHaveAttribute('aria-labelledby', 'wallet-install-title');
  });

  it('shows mobile-specific content on mobile devices', () => {
    // Mock mobile user agent
    Object.defineProperty(window, 'navigator', {
      value: {
        userAgent:
          'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15',
      },
      writable: true,
      configurable: true,
    });

    render(<WalletInstallModal isOpen={true} onClose={mockOnClose} />);

    // Mobile should show app store instructions
    expect(screen.getByText(/On mobile\? Install a wallet app/i)).toBeInTheDocument();
  });

  it('displays helper tip about refreshing page', () => {
    render(<WalletInstallModal isOpen={true} onClose={mockOnClose} />);

    expect(
      screen.getByText(/After installing, refresh this page and click/i)
    ).toBeInTheDocument();
  });
});
