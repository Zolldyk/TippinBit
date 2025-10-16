import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { TransactionStatus } from './TransactionStatus';

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line jsx-a11y/alt-text, @next/next/no-img-element
    return <img {...props} />;
  },
}));

describe('TransactionStatus', () => {
  const mockTxHash = '0x' + 'a'.repeat(64);
  const mockError = new Error('Insufficient funds for transaction');
  const mockStartTime = Date.now();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('renders nothing when state is idle', () => {
    const { container } = render(
      <TransactionStatus
        state="idle"
        txHash={null}
        error={null}
        startTime={null}
      />
    );

    expect(container.firstChild).toBeNull();
  });

  it('displays "Preparing transaction..." when state is simulating', () => {
    render(
      <TransactionStatus
        state="simulating"
        txHash={null}
        error={null}
        startTime={null}
      />
    );

    expect(screen.getByText('Preparing transaction...')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();
  });

  it('displays "Waiting for wallet confirmation..." when state is awaiting_signature', () => {
    render(
      <TransactionStatus
        state="awaiting_signature"
        txHash={null}
        error={null}
        startTime={null}
      />
    );

    expect(screen.getByText('Waiting for wallet confirmation...')).toBeInTheDocument();
    expect(screen.getByLabelText('Wallet')).toBeInTheDocument();
  });

  it('displays "Transaction submitted..." with tx hash link when state is pending', () => {
    render(
      <TransactionStatus
        state="pending"
        txHash={mockTxHash}
        error={null}
        startTime={mockStartTime}
      />
    );

    expect(screen.getByText('Transaction submitted...')).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();

    const link = screen.getByText('View on Mezo Explorer');
    expect(link).toBeInTheDocument();
    expect(link).toHaveAttribute('href', `https://explorer.test.mezo.org/tx/${mockTxHash}`);
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('displays "Confirming..." with spinner and progress indicator when state is confirming', () => {
    render(
      <TransactionStatus
        state="confirming"
        txHash={mockTxHash}
        error={null}
        startTime={mockStartTime}
        maxPolls={30}
      />
    );

    expect(screen.getByText(/Confirming\.\.\./)).toBeInTheDocument();
    expect(screen.getByLabelText('Loading')).toBeInTheDocument();

    // Progress indicator should show poll count
    const progressText = screen.getByText(/\/ 30 polls/);
    expect(progressText).toBeInTheDocument();

    const link = screen.getByText('View on Mezo Explorer');
    expect(link).toBeInTheDocument();
  });

  it('shows timeout warning when pollCount >= maxPolls during confirming', async () => {
    // Set startTime to 60 seconds ago to simulate timeout
    const oldStartTime = Date.now() - 61000;

    render(
      <TransactionStatus
        state="confirming"
        txHash={mockTxHash}
        error={null}
        startTime={oldStartTime}
        maxPolls={30}
      />
    );

    // Wait for poll count to update (happens in useEffect with 500ms interval)
    await waitFor(
      () => {
        const timeoutWarning = screen.getByText(/Transaction is taking longer than expected/);
        expect(timeoutWarning).toBeInTheDocument();
      },
      { timeout: 2000 }
    );

    expect(screen.getByLabelText('Warning')).toBeInTheDocument();
  });

  it('displays "Transaction confirmed!" with checkmark when state is success', () => {
    render(
      <TransactionStatus
        state="success"
        txHash={mockTxHash}
        error={null}
        startTime={mockStartTime}
      />
    );

    expect(screen.getByText('Transaction confirmed!')).toBeInTheDocument();
    expect(screen.getByLabelText('Success checkmark')).toBeInTheDocument();

    const link = screen.getByText('View on Mezo Explorer');
    expect(link).toBeInTheDocument();
  });

  it('displays error message when state is error', () => {
    render(
      <TransactionStatus
        state="error"
        txHash={mockTxHash}
        error={mockError}
        startTime={mockStartTime}
      />
    );

    // Heading text appears
    expect(screen.getAllByText('Transaction failed')[0]).toBeInTheDocument();
    // Error message appears
    expect(screen.getByText(mockError.message)).toBeInTheDocument();
    expect(screen.getByLabelText('Error')).toBeInTheDocument();

    const link = screen.getByText('View on Mezo Explorer');
    expect(link).toBeInTheDocument();
  });

  it('displays explorer link with correct URL format', () => {
    render(
      <TransactionStatus
        state="success"
        txHash={mockTxHash}
        error={null}
        startTime={mockStartTime}
      />
    );

    const link = screen.getByRole('link', { name: /View transaction on Mezo Explorer/i });
    expect(link).toHaveAttribute('href', `https://explorer.test.mezo.org/tx/${mockTxHash}`);
  });

  it('has proper accessibility attributes', () => {
    const { container } = render(
      <TransactionStatus
        state="confirming"
        txHash={mockTxHash}
        error={null}
        startTime={mockStartTime}
      />
    );

    const statusContainer = container.querySelector('[aria-live="polite"]');
    expect(statusContainer).toBeInTheDocument();

    const roleStatus = container.querySelector('[role="status"]');
    expect(roleStatus).toBeInTheDocument();
  });

  it('uses default maxPolls of 30 if not provided', async () => {
    const oldStartTime = Date.now() - 65000; // Over 60 seconds ago

    render(
      <TransactionStatus
        state="confirming"
        txHash={mockTxHash}
        error={null}
        startTime={oldStartTime}
        // maxPolls not provided, should default to 30
      />
    );

    // Should show timeout warning since more than 30 polls would have occurred
    await waitFor(
      () => {
        expect(screen.getByText(/Transaction is taking longer than expected/)).toBeInTheDocument();
      },
      { timeout: 2000 }
    );
  });

  it('does not show explorer link when txHash is null', () => {
    render(
      <TransactionStatus
        state="confirming"
        txHash={null}
        error={null}
        startTime={mockStartTime}
      />
    );

    expect(screen.queryByText('View on Mezo Explorer')).not.toBeInTheDocument();
  });

  it('applies fade-in animation class when visible', () => {
    const { container } = render(
      <TransactionStatus
        state="confirming"
        txHash={mockTxHash}
        error={null}
        startTime={mockStartTime}
      />
    );

    const statusDiv = container.querySelector('.transition-opacity');
    expect(statusDiv).toBeInTheDocument();
  });
});
