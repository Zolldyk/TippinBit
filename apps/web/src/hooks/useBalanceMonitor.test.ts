import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useBalanceMonitor } from './useBalanceMonitor';
import { useBalance } from 'wagmi';
import type { UseBalanceReturnType } from 'wagmi';
import { parseEther } from 'viem';
import type { Address } from 'viem';

// Mock Wagmi's useBalance hook
vi.mock('wagmi', () => ({
  useBalance: vi.fn(),
}));

describe('useBalanceMonitor', () => {
  const mockAddress: Address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const mockMusdAddress: Address =
    '0x1234567890123456789012345678901234567890';

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllTimers();
  });

  it('fetches MUSD balance on mount', () => {
    const mockBalance = {
      data: {
        value: parseEther('15.30'),
        decimals: 18,
        symbol: 'MUSD',
        formatted: '15.3',
      },
      isLoading: false,
      refetch: vi.fn(),
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    const { result } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    expect(result.current.balance).toBe(parseEther('15.30'));
    expect(result.current.balanceUsd).toBe('15.30');
    expect(result.current.isLoading).toBe(false);
  });

  it('converts balance from wei to MUSD correctly (18 decimals)', () => {
    const mockBalance = {
      data: {
        value: BigInt('1234567890123456789'), // ~1.234 MUSD
        decimals: 18,
        symbol: 'MUSD',
        formatted: '1.234567890123456789',
      },
      isLoading: false,
      refetch: vi.fn(),
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    const { result } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    expect(result.current.balanceUsd).toBe('1.23'); // Formatted to 2 decimals
  });

  it('formats balance as USD string with 2 decimals', () => {
    const mockBalance = {
      data: {
        value: parseEther('100.999'),
        decimals: 18,
        symbol: 'MUSD',
        formatted: '100.999',
      },
      isLoading: false,
      refetch: vi.fn(),
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    const { result } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    expect(result.current.balanceUsd).toBe('101.00'); // Rounds up
  });

  it('configures refetch interval to 10 seconds', () => {
    const mockBalance = {
      data: {
        value: parseEther('15.30'),
        decimals: 18,
        symbol: 'MUSD',
        formatted: '15.3',
      },
      isLoading: false,
      refetch: vi.fn(),
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    // Check that useBalance was called with correct refetch interval
    expect(useBalance).toHaveBeenCalledWith({
      address: mockAddress,
      token: mockMusdAddress,
      query: {
        refetchInterval: 10000,
        enabled: true,
      },
    });
  });

  it('reduces balance immediately with optimistic update', async () => {
    const mockRefetch = vi.fn().mockResolvedValue({});
    const mockBalance = {
      data: {
        value: parseEther('15.30'),
        decimals: 18,
        symbol: 'MUSD',
        formatted: '15.3',
      },
      isLoading: false,
      refetch: mockRefetch,
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    const { result, rerender } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    // Send 5 MUSD
    result.current.updateOptimistically(parseEther('5'));

    // Rerender to apply state change
    rerender();

    // Balance should immediately show 10.30 MUSD
    await waitFor(() => {
      expect(result.current.balance).toBe(parseEther('10.30'));
      expect(result.current.balanceUsd).toBe('10.30');
    });
  });

  it('triggers refetch after optimistic update', async () => {
    vi.useFakeTimers();

    const mockRefetch = vi.fn().mockResolvedValue({});
    const mockBalance = {
      data: {
        value: parseEther('15.30'),
        decimals: 18,
        symbol: 'MUSD',
        formatted: '15.3',
      },
      isLoading: false,
      refetch: mockRefetch,
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    const { result } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    // Send 5 MUSD (this triggers setTimeout internally)
    const updatePromise = result.current.updateOptimistically(parseEther('5'));

    // Fast-forward time by 1 second to trigger the setTimeout
    await vi.advanceTimersByTimeAsync(1000);

    // Wait for the update to complete
    await updatePromise;

    // Refetch should be called after 1 second
    expect(mockRefetch).toHaveBeenCalled();

    vi.useRealTimers();
  });

  it('handles error gracefully when RPC fails', () => {
    const mockBalance = {
      data: undefined,
      isLoading: false,
      error: new Error('RPC connection failed'),
      refetch: vi.fn(),
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    const { result } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    // Should return null balance on error (graceful degradation)
    expect(result.current.balance).toBe(null);
    expect(result.current.balanceUsd).toBe(null);
    expect(result.current.isLoading).toBe(false);
  });

  it('returns "0.00" string for zero balance', () => {
    const mockBalance = {
      data: {
        value: BigInt(0),
        decimals: 18,
        symbol: 'MUSD',
        formatted: '0',
      },
      isLoading: false,
      refetch: vi.fn(),
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    const { result } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    expect(result.current.balance).toBe(BigInt(0));
    expect(result.current.balanceUsd).toBe('0.00');
  });

  it('shows loading state while fetching', () => {
    const mockBalance = {
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    const { result } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.balance).toBe(null);
    expect(result.current.balanceUsd).toBe(null);
  });

  it('handles undefined address (disabled state)', () => {
    const mockBalance = {
      data: undefined,
      isLoading: false,
      refetch: vi.fn(),
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    renderHook(() =>
      useBalanceMonitor({
        address: undefined,
        musdAddress: mockMusdAddress,
      })
    );

    // Check that useBalance was called with enabled: false
    expect(useBalance).toHaveBeenCalledWith({
      address: undefined,
      token: mockMusdAddress,
      query: {
        refetchInterval: 10000,
        enabled: false,
      },
    });
  });

  it('refetch clears optimistic balance and fetches fresh data', async () => {
    const mockRefetch = vi.fn().mockResolvedValue({});
    const mockBalance = {
      data: {
        value: parseEther('15.30'),
        decimals: 18,
        symbol: 'MUSD',
        formatted: '15.3',
      },
      isLoading: false,
      refetch: mockRefetch,
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    const { result, rerender } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    // Initial balance should be from chain
    expect(result.current.balance).toBe(parseEther('15.30'));

    // Apply optimistic update (without waiting for setTimeout/refetch)
    const updatePromise = result.current.updateOptimistically(parseEther('5'));
    rerender();

    // Balance should be optimistically reduced
    expect(result.current.balance).toBe(parseEther('10.30'));

    // Call refetch manually - this clears optimistic state
    await result.current.refetch();

    // Should call wagmi refetch
    expect(mockRefetch).toHaveBeenCalled();

    // Rerender to apply cleared optimistic state
    rerender();

    // After refetch, should return to chain balance (optimistic cleared)
    expect(result.current.balance).toBe(parseEther('15.30'));

    // Clean up the pending update promise
    await updatePromise.catch(() => {
      // Ignore errors from the optimistic update timeout
    });
  });

  it('prevents negative balance from optimistic update', async () => {
    const mockBalance = {
      data: {
        value: parseEther('5'),
        decimals: 18,
        symbol: 'MUSD',
        formatted: '5',
      },
      isLoading: false,
      refetch: vi.fn(),
    };
    vi.mocked(useBalance).mockReturnValue(mockBalance as unknown as UseBalanceReturnType);

    const { result, rerender } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    // Try to send 10 MUSD (more than balance)
    const updatePromise = result.current.updateOptimistically(parseEther('10'));

    // Rerender to apply state change
    rerender();

    // Balance should be 0, not negative
    expect(result.current.balance).toBe(BigInt(0));
    expect(result.current.balanceUsd).toBe('0.00');

    // Clean up the pending update promise
    await updatePromise.catch(() => {
      // Ignore errors from the optimistic update timeout
    });
  });

  it('resets optimistic balance when chain data catches up', async () => {
    const mockRefetch = vi.fn();

    // Start with initial balance
    const initialMockBalance = {
      data: {
        value: parseEther('15.30'),
        decimals: 18,
        symbol: 'MUSD',
        formatted: '15.3',
      },
      isLoading: false,
      refetch: mockRefetch,
    };
    vi.mocked(useBalance).mockReturnValue(initialMockBalance as unknown as UseBalanceReturnType);

    const { result, rerender } = renderHook(() =>
      useBalanceMonitor({
        address: mockAddress,
        musdAddress: mockMusdAddress,
      })
    );

    // Apply optimistic update (send 5 MUSD)
    const updatePromise = result.current.updateOptimistically(parseEther('5'));
    rerender();

    // Balance should be optimistically reduced
    expect(result.current.balance).toBe(parseEther('10.30'));

    // Simulate chain balance updating to reflect transaction
    const updatedMockBalance = {
      data: {
        value: parseEther('10.30'),
        decimals: 18,
        symbol: 'MUSD',
        formatted: '10.3',
      },
      isLoading: false,
      refetch: mockRefetch,
    };
    vi.mocked(useBalance).mockReturnValue(updatedMockBalance as unknown as UseBalanceReturnType);

    // Rerender to trigger useEffect that clears optimistic balance
    rerender();

    // Optimistic balance should be cleared, now using chain balance
    // The balance is still 10.30 but now from chain data, not optimistic
    expect(result.current.balance).toBe(parseEther('10.30'));

    // Clean up the pending update promise
    await updatePromise.catch(() => {
      // Ignore errors from the optimistic update timeout
    });
  });
});
