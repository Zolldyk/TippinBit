import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ErrorMessage } from './ErrorMessage';
import type { TransactionErrorResult } from '@/lib/error-parser';

describe('ErrorMessage', () => {
  it('does not render for user rejection errors', () => {
    const error: TransactionErrorResult = {
      userMessage: '',
      code: 'USER_REJECTED',
      isUserRejection: true,
      severity: 'info',
    };

    const { container } = render(<ErrorMessage error={error} />);

    expect(container.firstChild).toBeNull();
  });

  it('renders warning style for insufficient funds error', () => {
    const error: TransactionErrorResult = {
      userMessage: "You don't have enough MUSD for this transaction",
      code: 'INSUFFICIENT_FUNDS',
      isUserRejection: false,
      severity: 'warning',
      actionable: 'Get MUSD from testnet faucet',
    };

    render(<ErrorMessage error={error} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-amber-300', 'bg-amber-50', 'text-amber-800');
    expect(screen.getByText("You don't have enough MUSD for this transaction")).toBeInTheDocument();
  });

  it('renders error style for contract revert', () => {
    const error: TransactionErrorResult = {
      userMessage: 'Transaction failed on the blockchain. Your funds are safe.',
      code: 'CONTRACT_REVERT',
      isUserRejection: false,
      severity: 'error',
    };

    render(<ErrorMessage error={error} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-red-300', 'bg-red-50', 'text-red-800');
  });

  it('displays actionable message when provided', () => {
    const error: TransactionErrorResult = {
      userMessage: 'Transaction failed due to network fee.',
      code: 'OUT_OF_GAS',
      isUserRejection: false,
      severity: 'warning',
      actionable: 'Try again with higher gas or reduce tip amount',
    };

    render(<ErrorMessage error={error} />);

    expect(screen.getByText('Try again with higher gas or reduce tip amount')).toBeInTheDocument();
  });

  it('calls onRetry when retry button is clicked', async () => {
    const user = userEvent.setup();
    const onRetry = vi.fn();
    const error: TransactionErrorResult = {
      userMessage: 'Connection lost. Your funds are safe. Retry now?',
      code: 'TIMEOUT',
      isUserRejection: false,
      severity: 'warning',
    };

    render(<ErrorMessage error={error} onRetry={onRetry} />);

    const retryButton = screen.getByRole('button', { name: 'Try again' });
    await user.click(retryButton);

    expect(onRetry).toHaveBeenCalledTimes(1);
  });

  it('calls onDismiss when dismiss button is clicked', async () => {
    const user = userEvent.setup();
    const onDismiss = vi.fn();
    const error: TransactionErrorResult = {
      userMessage: 'An unexpected error occurred.',
      code: 'UNKNOWN',
      isUserRejection: false,
      severity: 'error',
    };

    render(<ErrorMessage error={error} onDismiss={onDismiss} />);

    const dismissButton = screen.getByRole('button', { name: 'Dismiss' });
    await user.click(dismissButton);

    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it('renders "Get MUSD" link for insufficient funds error', () => {
    const error: TransactionErrorResult = {
      userMessage: "You don't have enough MUSD for this transaction",
      code: 'INSUFFICIENT_FUNDS',
      isUserRejection: false,
      severity: 'warning',
    };

    render(<ErrorMessage error={error} />);

    const link = screen.getByRole('link', { name: 'Get MUSD' });
    expect(link).toHaveAttribute('href', 'https://faucet.test.mezo.org');
    expect(link).toHaveAttribute('target', '_blank');
    expect(link).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('derives severity from code when not provided', () => {
    const error: TransactionErrorResult = {
      userMessage: 'Unable to estimate gas.',
      code: 'GAS_ESTIMATION_FAILED',
      isUserRejection: false,
      // No severity provided
    };

    render(<ErrorMessage error={error} />);

    const alert = screen.getByRole('alert');
    // Should derive 'warning' severity from code
    expect(alert).toHaveClass('border-amber-300', 'bg-amber-50', 'text-amber-800');
  });

  it('has accessible ARIA attributes', () => {
    const error: TransactionErrorResult = {
      userMessage: 'Test error message',
      code: 'TEST_ERROR',
      isUserRejection: false,
      severity: 'error',
    };

    render(<ErrorMessage error={error} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveAttribute('aria-live', 'polite');
  });

  it('renders info style when severity is info', () => {
    const error: TransactionErrorResult = {
      userMessage: 'Information message',
      code: 'INFO',
      isUserRejection: false,
      severity: 'info',
    };

    render(<ErrorMessage error={error} />);

    const alert = screen.getByRole('alert');
    expect(alert).toHaveClass('border-blue-300', 'bg-blue-50', 'text-blue-800');
  });

  it('renders both retry and get MUSD buttons for insufficient funds with retry', () => {
    const onRetry = vi.fn();
    const error: TransactionErrorResult = {
      userMessage: "You don't have enough MUSD for this transaction",
      code: 'INSUFFICIENT_FUNDS',
      isUserRejection: false,
      severity: 'warning',
    };

    render(<ErrorMessage error={error} onRetry={onRetry} />);

    expect(screen.getByRole('button', { name: 'Try again' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'Get MUSD' })).toBeInTheDocument();
  });
});
