import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { useSearchParams } from 'next/navigation';
import { ReturnButton } from './ReturnButton';

// Mock Next.js navigation
vi.mock('next/navigation', () => ({
  useSearchParams: vi.fn(),
}));

describe('ReturnButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();

    // Reset document.referrer to prevent cross-test pollution
    Object.defineProperty(document, 'referrer', {
      value: '',
      writable: true,
      configurable: true,
    });
  });

  describe('Referrer Detection from URL Parameter', () => {
    it('shows button when valid external referrer in ref param', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'https://external-site.com' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      expect(screen.getByLabelText("Return to creator's website")).toBeInTheDocument();
      expect(screen.getByText('Return to creator')).toBeInTheDocument();
    });

    it('hides button when no ref param provided', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn(() => null),
      } as unknown as ReturnType<typeof useSearchParams>);

      const { container } = render(<ReturnButton />);

      expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
      expect(container.firstChild).toBeNull();
    });

    it('hides button when ref param is tippinbit.com', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) =>
          key === 'ref' ? 'https://tippinbit.com/some-page' : null
        ),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
    });
  });

  describe('Referrer Detection from document.referrer', () => {
    it('shows button when valid external referrer from document', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn(() => null),
      } as unknown as ReturnType<typeof useSearchParams>);

      Object.defineProperty(document, 'referrer', {
        value: 'https://creator-blog.com',
        writable: true,
        configurable: true,
      });

      render(<ReturnButton />);

      expect(screen.getByText('Return to creator')).toBeInTheDocument();
    });

    it('prefers ref param over document.referrer', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'https://param-site.com' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      Object.defineProperty(document, 'referrer', {
        value: 'https://document-site.com',
        writable: true,
        configurable: true,
      });

      render(<ReturnButton />);

      const button = screen.getByLabelText("Return to creator's website");
      expect(button).toHaveAttribute('href', 'https://param-site.com');
    });
  });

  describe('Security Validation', () => {
    it('blocks localhost referrer', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'http://localhost:3000' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
      });
    });

    it('blocks internal IP 127.0.0.1', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'http://127.0.0.1:3000' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
      });
    });

    it('blocks private network 192.168.x.x', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'http://192.168.1.1' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
      });
    });

    it('blocks private network 10.x.x.x', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'http://10.0.0.1' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
      });
    });

    it('blocks non-http(s) protocols like javascript:', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'javascript:alert(1)' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
      });
    });

    it('blocks file: protocol', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'file:///etc/passwd' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
      });
    });

    it('blocks invalid URL format', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'not-a-valid-url' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
      });
    });
  });

  describe('Button Rendering', () => {
    it('renders with correct href attribute', () => {
      const validUrl = 'https://creator-site.com/page';
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? validUrl : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      const button = screen.getByLabelText("Return to creator's website");
      expect(button).toHaveAttribute('href', validUrl);
    });

    it('has external link icon', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'https://creator-site.com' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      const { container } = render(<ReturnButton />);

      // Check for ExternalLink icon SVG
      const svg = container.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('uses secondary button style (teal border)', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'https://creator-site.com' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      const button = screen.getByLabelText("Return to creator's website");
      expect(button.className).toContain('border-teal-500');
      expect(button.className).toContain('text-teal-600');
    });
  });

  describe('Accessibility', () => {
    it('has proper aria-label', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'https://creator-site.com' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      expect(screen.getByLabelText("Return to creator's website")).toBeInTheDocument();
    });

    it('applies motion-reduce classes', () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'https://creator-site.com' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      const button = screen.getByLabelText("Return to creator's website");
      expect(button.className).toContain('motion-reduce:transition-none');
      expect(button.className).toContain('motion-reduce:duration-0');
    });
  });

  describe('Edge Cases', () => {
    it('handles empty string ref param', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? '' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
      });
    });

    it('handles whitespace-only ref param', async () => {
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? '   ' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);

      await waitFor(() => {
        expect(screen.queryByLabelText("Return to creator's website")).not.toBeInTheDocument();
      });
    });

    it('allows both http and https protocols', () => {
      // Test http
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'http://creator-site.com' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      const { unmount } = render(<ReturnButton />);
      expect(screen.getByText('Return to creator')).toBeInTheDocument();

      unmount();

      // Test https
      vi.mocked(useSearchParams).mockReturnValue({
        get: vi.fn((key: string) => (key === 'ref' ? 'https://creator-site.com' : null)),
      } as unknown as ReturnType<typeof useSearchParams>);

      render(<ReturnButton />);
      expect(screen.getByText('Return to creator')).toBeInTheDocument();
    });
  });
});
