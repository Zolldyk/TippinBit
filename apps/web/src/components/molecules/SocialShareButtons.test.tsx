import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { SocialShareButtons } from './SocialShareButtons';

// Mock sonner toast
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
  },
}));

describe('SocialShareButtons', () => {
  const mockPaymentUrl = 'https://tippinbit.com/pay?to=0x9aabD891ab1FaA750FAE5aba9b55623c7F69fD58';

  beforeEach(() => {
    // Mock window.open
    vi.stubGlobal('open', vi.fn());

    // Mock clipboard API
    Object.defineProperty(navigator, 'clipboard', {
      value: {
        writeText: vi.fn().mockResolvedValue(undefined),
      },
      writable: true,
      configurable: true,
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  describe('Rendering', () => {
    it('renders all share buttons', () => {
      render(<SocialShareButtons paymentUrl={mockPaymentUrl} />);

      expect(screen.getByRole('button', { name: /share on twitter/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /share via email/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /copy link/i })).toBeInTheDocument();
    });

    it('renders section heading', () => {
      render(<SocialShareButtons paymentUrl={mockPaymentUrl} />);

      expect(screen.getByText(/share your link/i)).toBeInTheDocument();
    });
  });

  describe('Twitter Share', () => {
    it('generates correct Twitter intent URL without username', async () => {
      const user = userEvent.setup();
      const mockOpen = vi.fn();
      vi.stubGlobal('open', mockOpen);

      render(<SocialShareButtons paymentUrl={mockPaymentUrl} />);

      const twitterButton = screen.getByRole('button', { name: /share on twitter/i });
      await user.click(twitterButton);

      expect(mockOpen).toHaveBeenCalledWith(
        expect.stringContaining('https://twitter.com/intent/tweet?text='),
        '_blank',
        'noopener,noreferrer'
      );

      const callUrl = mockOpen.mock.calls[0][0];
      const decodedText = decodeURIComponent(callUrl.split('text=')[1]);
      expect(decodedText).toContain(mockPaymentUrl);
      expect(decodedText).toContain('Support me on TippinBit');
    });

    it('generates personalized Twitter text with username', async () => {
      const user = userEvent.setup();
      const mockOpen = vi.fn();
      vi.stubGlobal('open', mockOpen);

      render(
        <SocialShareButtons paymentUrl="https://tippinbit.com/pay/@alice" username="alice" />
      );

      const twitterButton = screen.getByRole('button', { name: /share on twitter/i });
      await user.click(twitterButton);

      const callUrl = mockOpen.mock.calls[0][0];
      const decodedText = decodeURIComponent(callUrl.split('text=')[1]);
      expect(decodedText).toContain('Check out my TippinBit link');
      expect(decodedText).toContain('https://tippinbit.com/pay/@alice');
    });

    it('properly encodes special characters in URL', async () => {
      const user = userEvent.setup();
      const mockOpen = vi.fn();
      vi.stubGlobal('open', mockOpen);

      const urlWithSpecialChars = 'https://tippinbit.com/pay?to=0x9aabD891ab1FaA750FAE5aba9b55623c7F69fD58&amount=5.50';
      render(<SocialShareButtons paymentUrl={urlWithSpecialChars} />);

      const twitterButton = screen.getByRole('button', { name: /share on twitter/i });
      await user.click(twitterButton);

      const callUrl = mockOpen.mock.calls[0][0];
      // Verify URL is properly encoded (no raw & characters)
      expect(callUrl).toContain(encodeURIComponent(urlWithSpecialChars));
    });
  });

  describe('Email Share', () => {
    it('generates correct mailto link', async () => {
      const user = userEvent.setup();
      const originalLocation = window.location;

      // Mock window.location
      delete (window as unknown as { location: unknown }).location;
      window.location = { ...originalLocation, href: '' } as Location;

      render(<SocialShareButtons paymentUrl={mockPaymentUrl} />);

      const emailButton = screen.getByRole('button', { name: /share via email/i });
      await user.click(emailButton);

      expect(window.location.href).toContain('mailto:?subject=');
      expect(window.location.href).toContain(encodeURIComponent('Support me on TippinBit'));
      expect(window.location.href).toContain(encodeURIComponent(mockPaymentUrl));

      // Restore window.location
      window.location = originalLocation;
    });

    it('includes payment URL in email body', async () => {
      const user = userEvent.setup();
      const originalLocation = window.location;

      delete (window as unknown as { location: unknown }).location;
      window.location = { ...originalLocation, href: '' } as Location;

      render(<SocialShareButtons paymentUrl={mockPaymentUrl} />);

      const emailButton = screen.getByRole('button', { name: /share via email/i });
      await user.click(emailButton);

      const mailtoUrl = window.location.href;
      const bodyParam = mailtoUrl.split('body=')[1];
      const decodedBody = decodeURIComponent(bodyParam);

      expect(decodedBody).toContain('You can send me tips at:');
      expect(decodedBody).toContain(mockPaymentUrl);

      window.location = originalLocation;
    });
  });

  describe('Copy Link', () => {
    it('copies payment URL to clipboard', async () => {
      const user = userEvent.setup();
      const { toast } = await import('sonner');

      render(<SocialShareButtons paymentUrl={mockPaymentUrl} />);

      const copyButton = screen.getByRole('button', { name: /copy link/i });
      await user.click(copyButton);

      expect(navigator.clipboard.writeText).toHaveBeenCalledWith(mockPaymentUrl);
      expect(toast.success).toHaveBeenCalledWith('Copied!', { duration: 3000 });
    });
  });

  describe('Accessibility', () => {
    it('has accessible labels for all buttons', () => {
      render(<SocialShareButtons paymentUrl={mockPaymentUrl} />);

      expect(screen.getByRole('button', { name: /share on twitter/i })).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: /share via email/i })).toHaveAccessibleName();
      expect(screen.getByRole('button', { name: /copy link/i })).toHaveAccessibleName();
    });

    it('has proper semantic structure', () => {
      const { container } = render(<SocialShareButtons paymentUrl={mockPaymentUrl} />);

      // Verify buttons are properly grouped
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(3);
    });
  });
});
