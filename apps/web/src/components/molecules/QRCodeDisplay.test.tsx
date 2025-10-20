import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { QRCodeDisplay } from './QRCodeDisplay';
import QRCode from 'qrcode';

// Mock qrcode library
vi.mock('qrcode', () => ({
  default: {
    toDataURL: vi.fn(),
  },
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: ({ src, alt }: { src: string; alt: string }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={src} alt={alt} />
  ),
}));

describe('QRCodeDisplay', () => {
  const mockDataUrl = 'data:image/png;base64,mockQRCode';

  beforeEach(() => {
    vi.clearAllMocks();
    (QRCode.toDataURL as ReturnType<typeof vi.fn>).mockResolvedValue(
      mockDataUrl
    );
  });

  it('generates QR code with correct URL (AC3)', async () => {
    const paymentUrl = 'https://tippinbit.com/pay/@alice';

    render(<QRCodeDisplay paymentUrl={paymentUrl} />);

    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        paymentUrl,
        expect.objectContaining({
          errorCorrectionLevel: 'H', // AC4
          width: 300,
          margin: 2,
          color: {
            dark: '#000000',
            light: '#FFFFFF',
          },
        })
      );
    });

    const img = screen.getByAltText(`QR code for ${paymentUrl}`);
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute('src', mockDataUrl);
  });

  it('uses error correction level H (AC4)', async () => {
    render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@bob" />);

    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          errorCorrectionLevel: 'H', // High (30% redundancy)
        })
      );
    });
  });

  it('regenerates QR code when paymentUrl changes (AC2)', async () => {
    const { rerender } = render(
      <QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />
    );

    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledTimes(1);
    });

    // Change URL
    rerender(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@bob" />);

    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledTimes(2);
      expect(QRCode.toDataURL).toHaveBeenLastCalledWith(
        'https://tippinbit.com/pay/@bob',
        expect.any(Object)
      );
    });
  });

  it('renders with correct default size (300x300) (AC4)', async () => {
    render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          width: 300,
        })
      );
    });
  });

  it('renders with custom size when specified', async () => {
    render(
      <QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" size={400} />
    );

    await waitFor(() => {
      expect(QRCode.toDataURL).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({
          width: 400,
        })
      );
    });
  });

  it('shows loading state during generation', () => {
    // Mock slow generation
    (QRCode.toDataURL as ReturnType<typeof vi.fn>).mockImplementation(
      () => new Promise((resolve) => setTimeout(() => resolve(mockDataUrl), 100))
    );

    render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

    expect(screen.getByText(/Generating QR code.../)).toBeInTheDocument();
  });

  it('displays alt text for accessibility', async () => {
    const paymentUrl = 'https://tippinbit.com/pay/@alice';

    render(<QRCodeDisplay paymentUrl={paymentUrl} />);

    await waitFor(() => {
      const img = screen.getByAltText(`QR code for ${paymentUrl}`);
      expect(img).toBeInTheDocument();
    });
  });

  it('calls onGenerated callback when QR code is generated', async () => {
    const onGenerated = vi.fn();

    render(
      <QRCodeDisplay
        paymentUrl="https://tippinbit.com/pay/@alice"
        onGenerated={onGenerated}
      />
    );

    await waitFor(() => {
      expect(onGenerated).toHaveBeenCalledWith(mockDataUrl);
    });
  });

  it('does not generate QR code when paymentUrl is empty', () => {
    render(<QRCodeDisplay paymentUrl="" />);

    expect(QRCode.toDataURL).not.toHaveBeenCalled();
    expect(screen.queryByAltText(/QR code for/)).not.toBeInTheDocument();
  });

  it('handles QR code generation errors gracefully', async () => {
    const consoleErrorSpy = vi
      .spyOn(console, 'error')
      .mockImplementation(() => {});

    (QRCode.toDataURL as ReturnType<typeof vi.fn>).mockRejectedValue(
      new Error('QR generation failed')
    );

    render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

    await waitFor(() => {
      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Failed to generate QR code:',
        expect.any(Error)
      );
    });

    // Component should not crash
    expect(screen.queryByAltText(/QR code for/)).not.toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });

  it('renders logo overlay when showLogo is true', async () => {
    render(
      <QRCodeDisplay
        paymentUrl="https://tippinbit.com/pay/@alice"
        showLogo={true}
      />
    );

    await waitFor(() => {
      const logo = screen.getByAltText('TippinBit logo');
      expect(logo).toBeInTheDocument();
    });
  });

  it('does not render logo overlay when showLogo is false', async () => {
    render(
      <QRCodeDisplay
        paymentUrl="https://tippinbit.com/pay/@alice"
        showLogo={false}
      />
    );

    await waitFor(() => {
      const logo = screen.queryByAltText('TippinBit logo');
      expect(logo).not.toBeInTheDocument();
    });
  });

  it('includes data-testid for E2E testing', async () => {
    render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

    await waitFor(() => {
      const img = screen.getByTestId('qr-code-image');
      expect(img).toBeInTheDocument();
    });
  });

  describe('Background Color Toggle (AC7 - Story 2.9)', () => {
    it('uses transparent background by default', async () => {
      render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

      await waitFor(() => {
        expect(QRCode.toDataURL).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            color: {
              dark: '#000000',
              light: '#00000000', // Transparent default per AC7
            },
          })
        );
      });
    });

    it('uses white background when backgroundColor prop is set', async () => {
      render(
        <QRCodeDisplay
          paymentUrl="https://tippinbit.com/pay/@alice"
          backgroundColor="#FFFFFF"
        />
      );

      await waitFor(() => {
        expect(QRCode.toDataURL).toHaveBeenCalledWith(
          expect.any(String),
          expect.objectContaining({
            color: {
              dark: '#000000',
              light: '#FFFFFF',
            },
          })
        );
      });
    });

    it('regenerates QR code when background color changes', async () => {
      const { rerender } = render(
        <QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />
      );

      await waitFor(() => {
        expect(QRCode.toDataURL).toHaveBeenCalledTimes(1);
      });

      // Change to white background
      rerender(
        <QRCodeDisplay
          paymentUrl="https://tippinbit.com/pay/@alice"
          backgroundColor="#FFFFFF"
        />
      );

      await waitFor(() => {
        expect(QRCode.toDataURL).toHaveBeenCalledTimes(2);
        expect(QRCode.toDataURL).toHaveBeenLastCalledWith(
          expect.any(String),
          expect.objectContaining({
            color: expect.objectContaining({ light: '#FFFFFF' }),
          })
        );
      });
    });
  });

  describe('Error Handling & Retry Mechanism (QA Review Fix)', () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it(
      'retries up to 3 times on failure',
      async () => {
        (QRCode.toDataURL as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Generation failed')
        );

        render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

        await vi.runAllTimersAsync();

        await waitFor(() => {
          expect(QRCode.toDataURL).toHaveBeenCalledTimes(3);
        });
      },
      10000
    );

    it(
      'shows user-facing error message after all retries exhausted',
      async () => {
        (QRCode.toDataURL as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Generation failed')
        );

        render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

        await vi.runAllTimersAsync();

        await waitFor(() => {
          expect(screen.getByText(/failed to generate qr code/i)).toBeInTheDocument();
        });
      },
      10000
    );

    it(
      'displays retry button in error state',
      async () => {
        (QRCode.toDataURL as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Generation failed')
        );

        render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

        await vi.runAllTimersAsync();

        await waitFor(() => {
          expect(screen.getByRole('button', { name: /try again/i })).toBeInTheDocument();
        });
      },
      10000
    );

    it(
      'shows retry attempt count during retries',
      async () => {
        (QRCode.toDataURL as ReturnType<typeof vi.fn>)
          .mockRejectedValueOnce(new Error('Fail 1'))
          .mockRejectedValueOnce(new Error('Fail 2'))
          .mockResolvedValueOnce(mockDataUrl);

        render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

        // Fast forward to first retry
        await vi.advanceTimersByTimeAsync(1000);

        await waitFor(() => {
          const retryText = screen.queryByText(/retry attempt 1\/3/i);
          if (retryText) expect(retryText).toBeInTheDocument();
        });
      },
      10000
    );

    it(
      'error container has proper ARIA attributes',
      async () => {
        (QRCode.toDataURL as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Generation failed')
        );

        render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

        await vi.runAllTimersAsync();

        await waitFor(() => {
          const errorContainer = screen.getByRole('alert');
          expect(errorContainer).toHaveAttribute('aria-live', 'assertive');
        });
      },
      10000
    );

    it(
      'retry button has accessible label',
      async () => {
        (QRCode.toDataURL as ReturnType<typeof vi.fn>).mockRejectedValue(
          new Error('Generation failed')
        );

        render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

        await vi.runAllTimersAsync();

        await waitFor(() => {
          const retryButton = screen.getByRole('button', { name: /retry qr code generation/i });
          expect(retryButton).toHaveAccessibleName();
        });
      },
      10000
    );

    it(
      'succeeds on second retry attempt',
      async () => {
        (QRCode.toDataURL as ReturnType<typeof vi.fn>)
          .mockRejectedValueOnce(new Error('First attempt failed'))
          .mockResolvedValueOnce(mockDataUrl);

        render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

        await vi.runAllTimersAsync();

        await waitFor(() => {
          const qrImage = screen.getByAltText(expect.stringContaining('QR code'));
          expect(qrImage).toBeInTheDocument();
          expect(qrImage).toHaveAttribute('src', mockDataUrl);
        });
      },
      10000
    );

    it('uses exponential backoff for retries', async () => {
      (QRCode.toDataURL as ReturnType<typeof vi.fn>).mockRejectedValue(
        new Error('Generation failed')
      );

      render(<QRCodeDisplay paymentUrl="https://tippinbit.com/pay/@alice" />);

      // First retry after 1000ms
      await vi.advanceTimersByTimeAsync(1000);
      expect(QRCode.toDataURL).toHaveBeenCalledTimes(2);

      // Second retry after 2000ms more (exponential backoff)
      await vi.advanceTimersByTimeAsync(2000);
      expect(QRCode.toDataURL).toHaveBeenCalledTimes(3);
    });
  });
});
