import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { UsernamePayPageClient } from './UsernamePayPageClient';
import * as useUsernameResolutionModule from '@/hooks/useUsernameResolution';
import type { UsernameResolutionResult } from '@/types/domain';

// Mock the useUsernameResolution hook
vi.mock('@/hooks/useUsernameResolution');

// Mock child components
vi.mock('@/components/molecules/UsernameResolutionLoading', () => ({
  UsernameResolutionLoading: ({ username }: { username: string }) => (
    <div data-testid="loading-skeleton">Resolving {username}...</div>
  ),
}));

vi.mock('@/components/organisms/UsernameNotFoundError', () => ({
  UsernameNotFoundError: ({
    username,
    type,
    onRetry,
  }: {
    username: string;
    type: string;
    onRetry?: () => void;
  }) => (
    <div data-testid="error-message">
      <p>Error: {type}</p>
      <p>{username}</p>
      {onRetry && (
        <button onClick={onRetry} data-testid="retry-button">
          Retry
        </button>
      )}
    </div>
  ),
}));

vi.mock('@/components/organisms/WalletConnector', () => ({
  WalletConnector: () => <div data-testid="wallet-connector">Connect</div>,
}));

vi.mock('@/components/molecules/RecipientCard', () => ({
  RecipientCard: ({
    recipientAddress,
    username,
  }: {
    recipientAddress: string;
    username?: string;
  }) => (
    <div data-testid="recipient-card">
      {username && <div data-testid="recipient-username">{username}</div>}
      <div data-testid="recipient-address">{recipientAddress}</div>
    </div>
  ),
}));

vi.mock('@/components/organisms/PaymentForm', () => ({
  PaymentForm: () => <div data-testid="payment-form">Payment Form</div>,
}));

describe('UsernamePayPageClient', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows loading skeleton while resolving username', () => {
    const mockResolution: UsernameResolutionResult = {
      status: 'loading',
    };

    vi.spyOn(useUsernameResolutionModule, 'useUsernameResolution').mockReturnValue(
      mockResolution
    );

    render(<UsernamePayPageClient username="@testuser" />);

    expect(screen.getByTestId('loading-skeleton')).toBeInTheDocument();
    expect(screen.getByText('Resolving @testuser...')).toBeInTheDocument();
  });

  it('displays payment page with username after successful resolution', async () => {
    const mockResolution: UsernameResolutionResult = {
      status: 'success',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as `0x${string}`,
      username: '@testuser' as `@${string}`,
      claimedAt: '2025-01-15T10:00:00Z',
    };

    vi.spyOn(useUsernameResolutionModule, 'useUsernameResolution').mockReturnValue(
      mockResolution
    );

    render(<UsernamePayPageClient username="@testuser" />);

    await waitFor(() => {
      expect(screen.getByTestId('recipient-card')).toBeInTheDocument();
    });

    expect(screen.getByTestId('recipient-username')).toHaveTextContent('@testuser');
    expect(screen.getByTestId('recipient-address')).toHaveTextContent(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    );
    expect(screen.getByTestId('payment-form')).toBeInTheDocument();
    expect(screen.getByText('Send a tip')).toBeInTheDocument();
  });

  it('shows "Username not found" error for 404 state', () => {
    const mockResolution: UsernameResolutionResult = {
      status: 'not_found',
    };

    vi.spyOn(useUsernameResolutionModule, 'useUsernameResolution').mockReturnValue(
      mockResolution
    );

    render(<UsernamePayPageClient username="@unclaimed999" />);

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Error: not_found')).toBeInTheDocument();
    expect(screen.getByText('@unclaimed999')).toBeInTheDocument();
  });

  it('shows network error message for error state', () => {
    const mockResolution: UsernameResolutionResult = {
      status: 'error',
      error: 'Network error',
    };

    vi.spyOn(useUsernameResolutionModule, 'useUsernameResolution').mockReturnValue(
      mockResolution
    );

    render(<UsernamePayPageClient username="@alice" />);

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText('Error: network_error')).toBeInTheDocument();
  });

  it('retry button re-triggers resolution', async () => {
    const mockResolution: UsernameResolutionResult = {
      status: 'error',
      error: 'Network error',
    };

    vi.spyOn(useUsernameResolutionModule, 'useUsernameResolution').mockReturnValue(
      mockResolution
    );

    // Mock window.location.reload
    const reloadMock = vi.fn();
    Object.defineProperty(window, 'location', {
      value: { reload: reloadMock },
      writable: true,
    });

    render(<UsernamePayPageClient username="@alice" />);

    const retryButton = screen.getByTestId('retry-button');
    await userEvent.click(retryButton);

    expect(reloadMock).toHaveBeenCalled();
  });

  it('username displayed as primary with address as secondary', async () => {
    const mockResolution: UsernameResolutionResult = {
      status: 'success',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as `0x${string}`,
      username: '@alice' as `@${string}`,
      claimedAt: '2025-01-15T10:00:00Z',
    };

    vi.spyOn(useUsernameResolutionModule, 'useUsernameResolution').mockReturnValue(
      mockResolution
    );

    render(<UsernamePayPageClient username="@alice" />);

    await waitFor(() => {
      expect(screen.getByTestId('recipient-username')).toBeInTheDocument();
    });

    // Username should be displayed
    expect(screen.getByTestId('recipient-username')).toHaveTextContent('@alice');
    // Address should also be displayed
    expect(screen.getByTestId('recipient-address')).toHaveTextContent(
      '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb'
    );
  });

  it('adds @ prefix if username provided without it', () => {
    const mockResolution: UsernameResolutionResult = {
      status: 'loading',
    };

    const spy = vi
      .spyOn(useUsernameResolutionModule, 'useUsernameResolution')
      .mockReturnValue(mockResolution);

    render(<UsernamePayPageClient username="bob" />);

    // Hook should be called with @ prefix added
    expect(spy).toHaveBeenCalledWith('@bob');
  });
});
