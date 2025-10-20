import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { AddressLinkForm } from './AddressLinkForm';

// Mock dependencies
vi.mock('wagmi', () => ({
  useAccount: vi.fn(() => ({ address: undefined })),
}));

vi.mock('@/hooks/useDebounce', () => ({
  useDebounce: vi.fn((value) => value),
}));

vi.mock('./QRCodeDisplay', () => ({
  QRCodeDisplay: vi.fn(({ paymentUrl, onGenerated }) => {
    // Simulate QR generation
    setTimeout(() => onGenerated?.('data:image/png;base64,mockQR'), 0);
    return <div data-testid="qr-code-display">QR Code: {paymentUrl}</div>;
  }),
}));

vi.mock('../atoms/QRCodeDownloadButton', () => ({
  QRCodeDownloadButton: vi.fn(() => <button>Download QR Code</button>),
}));

vi.mock('./SocialShareButtons', () => ({
  SocialShareButtons: vi.fn(() => <div data-testid="social-share-buttons">Social Share</div>),
}));

vi.mock('../organisms/WalletConnector', () => ({
  WalletConnector: vi.fn(() => <button>Connect Wallet</button>),
}));

vi.mock('@/lib/payment-url', () => ({
  buildPaymentUrl: vi.fn(({ address, amount }) => {
    const base = `https://tippinbit.com/pay?to=${address}`;
    return amount ? `${base}&amount=${amount}` : base;
  }),
  generateQRFilename: vi.fn((username, address) => {
    return address ? `tippinbit-${address.slice(0, 8)}.png` : 'tippinbit-qr.png';
  }),
}));

const TEST_ADDRESS = '0x9aabD891ab1FaA750FAE5aba9b55623c7F69fD58';

describe('AddressLinkForm', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Empty State (AC10)', () => {
    it('shows empty state when no address provided and wallet not connected', () => {
      render(<AddressLinkForm />);

      expect(
        screen.getByText(/connect your wallet or enter an address to get started/i)
      ).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /connect wallet/i })).toBeInTheDocument();
    });

    it('does not show form when in empty state', () => {
      render(<AddressLinkForm />);

      expect(screen.queryByLabelText(/wallet address/i)).not.toBeInTheDocument();
    });
  });

  describe('Address Input (AC1)', () => {
    it('renders address input field', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const input = screen.getByLabelText(/wallet address/i);
      expect(input).toBeInTheDocument();
      expect(input).toHaveValue(TEST_ADDRESS);
    });

    it('accepts valid Ethereum address', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm />);

      const input = screen.getByLabelText(/wallet address/i);
      await user.clear(input);
      await user.type(input, TEST_ADDRESS);

      expect(input).toHaveValue(TEST_ADDRESS);
      expect(screen.queryByText(/invalid ethereum address/i)).not.toBeInTheDocument();
    });

    it('shows error for invalid address', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm />);

      const input = screen.getByLabelText(/wallet address/i);
      await user.type(input, 'invalid-address');

      await waitFor(() => {
        expect(screen.getByText(/invalid ethereum address/i)).toBeInTheDocument();
      });
    });

    it('has proper ARIA attributes for validation', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm />);

      const input = screen.getByLabelText(/wallet address/i);
      await user.type(input, 'invalid');

      await waitFor(() => {
        expect(input).toHaveAttribute('aria-invalid', 'true');
        expect(input).toHaveAttribute('aria-describedby', 'address-error');
      });
    });

    it('pre-fills address from prop', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const input = screen.getByLabelText(/wallet address/i);
      expect(input).toHaveValue(TEST_ADDRESS);
    });
  });

  describe('Payment Link Generation (AC1, AC6)', () => {
    it('generates payment link for valid address', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const linkInput = screen.getByLabelText(/generated payment link/i);
      expect(linkInput).toHaveValue(`https://tippinbit.com/pay?to=${TEST_ADDRESS}`);
    });

    it('does not show payment link for invalid address', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm />);

      const input = screen.getByLabelText(/wallet address/i);
      await user.type(input, 'invalid');

      expect(screen.queryByLabelText(/generated payment link/i)).not.toBeInTheDocument();
    });

    it('updates link in real-time when address changes', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm />);

      const input = screen.getByLabelText(/wallet address/i);
      await user.type(input, TEST_ADDRESS);

      await waitFor(() => {
        const linkInput = screen.getByLabelText(/generated payment link/i);
        expect(linkInput).toHaveValue(expect.stringContaining(TEST_ADDRESS));
      });
    });

    it('makes payment link readonly', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const linkInput = screen.getByLabelText(/generated payment link/i);
      expect(linkInput).toHaveAttribute('readonly');
    });
  });

  describe('Test Your Link Button (AC3)', () => {
    it('renders test link button when address is valid', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      expect(screen.getByRole('button', { name: /test your link/i })).toBeInTheDocument();
    });

    it('opens payment link in new tab when clicked', async () => {
      const user = userEvent.setup();
      const mockOpen = vi.fn();
      vi.stubGlobal('open', mockOpen);

      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const testButton = screen.getByRole('button', { name: /test your link/i });
      await user.click(testButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining(TEST_ADDRESS),
        '_blank',
        'noopener,noreferrer'
      );

      vi.unstubAllGlobals();
    });

    it('has minimum touch target size for accessibility', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const testButton = screen.getByRole('button', { name: /test your link/i });
      expect(testButton).toHaveClass('min-h-[44px]');
    });
  });

  describe('Amount Presets (AC4)', () => {
    it('renders all preset amount buttons', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      expect(screen.getByRole('button', { name: /set amount to \$3/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set amount to \$5/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set amount to \$10/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /set amount to \$25/i })).toBeInTheDocument();
    });

    it('renders Custom and No amount buttons', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      expect(screen.getByRole('button', { name: /enter custom amount/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /no preset amount/i })).toBeInTheDocument();
    });

    it('updates payment URL when preset selected', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const preset5Button = screen.getByRole('button', { name: /set amount to \$5/i });
      await user.click(preset5Button);

      await waitFor(() => {
        const linkInput = screen.getByLabelText(/generated payment link/i);
        expect(linkInput).toHaveValue(expect.stringContaining('amount=5'));
      });
    });

    it('toggles preset button active state', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const preset10Button = screen.getByRole('button', { name: /set amount to \$10/i });
      await user.click(preset10Button);

      await waitFor(() => {
        expect(preset10Button).toHaveAttribute('aria-pressed', 'true');
        expect(preset10Button).toHaveClass('bg-coral');
      });
    });

    it('all amount buttons have minimum 44px height for accessibility', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const buttons = screen.getAllByRole('button');
      const amountButtons = buttons.filter((b) =>
        b.textContent?.match(/\$|Custom|No amount/)
      );

      amountButtons.forEach((button) => {
        expect(button).toHaveClass('min-h-[44px]');
      });
    });
  });

  describe('Custom Amount Input (AC4)', () => {
    it('shows custom input when Custom button clicked', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const customButton = screen.getByRole('button', { name: /enter custom amount/i });
      await user.click(customButton);

      expect(screen.getByLabelText(/custom tip amount in usd/i)).toBeInTheDocument();
    });

    it('accepts valid decimal amounts', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const customButton = screen.getByRole('button', { name: /enter custom amount/i });
      await user.click(customButton);

      const customInput = screen.getByLabelText(/custom tip amount in usd/i);
      await user.type(customInput, '12.50');

      expect(customInput).toHaveValue('12.50');
    });

    it('rejects amounts with more than 2 decimal places', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const customButton = screen.getByRole('button', { name: /enter custom amount/i });
      await user.click(customButton);

      const customInput = screen.getByLabelText(/custom tip amount in usd/i);
      await user.type(customInput, '12.555');

      // Should only accept up to 2 decimal places
      expect(customInput).toHaveValue('12.55');
    });

    it('rejects negative amounts', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const customButton = screen.getByRole('button', { name: /enter custom amount/i });
      await user.click(customButton);

      const customInput = screen.getByLabelText(/custom tip amount in usd/i);
      await user.type(customInput, '-5');

      expect(customInput).toHaveValue('');
    });

    it('rejects amounts over $100,000', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const customButton = screen.getByRole('button', { name: /enter custom amount/i });
      await user.click(customButton);

      const customInput = screen.getByLabelText(/custom tip amount in usd/i);
      await user.type(customInput, '100001');

      expect(customInput).toHaveValue('');
    });

    it('updates payment URL with custom amount', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const customButton = screen.getByRole('button', { name: /enter custom amount/i });
      await user.click(customButton);

      const customInput = screen.getByLabelText(/custom tip amount in usd/i);
      await user.type(customInput, '15.75');

      await waitFor(() => {
        const linkInput = screen.getByLabelText(/generated payment link/i);
        expect(linkInput).toHaveValue(expect.stringContaining('amount=15.75'));
      });
    });

    it('shows validation hint text', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const customButton = screen.getByRole('button', { name: /enter custom amount/i });
      await user.click(customButton);

      expect(screen.getByText(/maximum \$100,000, up to 2 decimal places/i)).toBeInTheDocument();
    });

    it('has decimal input mode for mobile keyboards', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const customButton = screen.getByRole('button', { name: /enter custom amount/i });
      await user.click(customButton);

      const customInput = screen.getByLabelText(/custom tip amount in usd/i);
      expect(customInput).toHaveAttribute('inputMode', 'decimal');
    });
  });

  describe('QR Code Section (AC7)', () => {
    it('renders QR code for valid address', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      expect(screen.getByTestId('qr-code-display')).toBeInTheDocument();
    });

    it('renders background toggle checkbox', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const checkbox = screen.getByLabelText(/use white background for qr code/i);
      expect(checkbox).toBeInTheDocument();
      expect(checkbox).toHaveAttribute('type', 'checkbox');
    });

    it('defaults to transparent background', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const checkbox = screen.getByLabelText(/use white background for qr code/i);
      expect(checkbox).not.toBeChecked();
    });

    it('toggles background color when checkbox changed', async () => {
      const user = userEvent.setup();
      const { QRCodeDisplay } = await import('./QRCodeDisplay');

      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const checkbox = screen.getByLabelText(/use white background for qr code/i);
      await user.click(checkbox);

      await waitFor(() => {
        expect(checkbox).toBeChecked();
        expect(QRCodeDisplay).toHaveBeenLastCalledWith(
          expect.objectContaining({ backgroundColor: '#FFFFFF' }),
          expect.anything()
        );
      });
    });

    it('renders QR download button', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      expect(screen.getByRole('button', { name: /download qr code/i })).toBeInTheDocument();
    });
  });

  describe('Social Sharing (AC8)', () => {
    it('renders social share buttons for valid address', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      expect(screen.getByTestId('social-share-buttons')).toBeInTheDocument();
    });

    it('does not render social buttons for invalid address', () => {
      render(<AddressLinkForm />);

      expect(screen.queryByTestId('social-share-buttons')).not.toBeInTheDocument();
    });
  });

  describe('Accessibility (AC12)', () => {
    it('has proper labels for all form inputs', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      expect(screen.getByLabelText(/wallet address/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/generated payment link/i)).toBeInTheDocument();
      expect(screen.getByLabelText(/use white background for qr code/i)).toBeInTheDocument();
    });

    it('has ARIA labels for all buttons', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const buttons = screen.getAllByRole('button');
      buttons.forEach((button) => {
        // Every button should have accessible name either via text or aria-label
        expect(button).toHaveAccessibleName();
      });
    });

    it('uses aria-pressed for toggle buttons', () => {
      render(<AddressLinkForm prefilledAddress={TEST_ADDRESS} />);

      const noAmountButton = screen.getByRole('button', { name: /no preset amount/i });
      expect(noAmountButton).toHaveAttribute('aria-pressed');
    });

    it('announces errors to screen readers', async () => {
      const user = userEvent.setup();
      render(<AddressLinkForm />);

      const input = screen.getByLabelText(/wallet address/i);
      await user.type(input, 'invalid');

      await waitFor(() => {
        const errorMessage = screen.getByText(/invalid ethereum address/i);
        expect(errorMessage).toHaveAttribute('role', 'alert');
      });
    });
  });
});
