import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useBTCBalance } from './useBTCBalance';
import { parseEther } from 'viem';
import type { Address } from 'viem';

// Mock wagmi
vi.mock('wagmi', () => ({
  useReadContract: vi.fn(),
}));

// Import after mocking
import { useReadContract } from 'wagmi';

describe('useBTCBalance', () => {
  const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns BTC balance when wallet connected', async () => {
    const mockBalance = parseEther('0.005');

    vi.mocked(useReadContract).mockReturnValue({
      data: mockBalance,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReadContract>);

    const { result } = renderHook(() =>
      useBTCBalance({ address: mockAddress })
    );

    await waitFor(() => {
      expect(result.current.btcBalance).toBe(mockBalance);
      expect(result.current.btcBalanceFormatted).toBe('0.005000');
      expect(result.current.isLoading).toBe(false);
    });
  });

  it('returns null when wallet not connected', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: undefined,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReadContract>);

    const { result } = renderHook(() =>
      useBTCBalance({ address: undefined })
    );

    expect(result.current.btcBalance).toBeNull();
    expect(result.current.btcBalanceFormatted).toBeNull();
  });

  it('formats balance correctly from 18 decimals', async () => {
    const mockBalance = parseEther('1.234567');

    vi.mocked(useReadContract).mockReturnValue({
      data: mockBalance,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReadContract>);

    const { result } = renderHook(() =>
      useBTCBalance({ address: mockAddress })
    );

    await waitFor(() => {
      expect(result.current.btcBalanceFormatted).toBe('1.234567');
    });
  });

  it('formats small balance correctly with 6 decimals', async () => {
    const mockBalance = parseEther('0.000001');

    vi.mocked(useReadContract).mockReturnValue({
      data: mockBalance,
      isLoading: false,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReadContract>);

    const { result } = renderHook(() =>
      useBTCBalance({ address: mockAddress })
    );

    await waitFor(() => {
      expect(result.current.btcBalanceFormatted).toBe('0.000001');
    });
  });

  it('loading state works correctly', () => {
    vi.mocked(useReadContract).mockReturnValue({
      data: undefined,
      isLoading: true,
      refetch: vi.fn(),
    } as unknown as ReturnType<typeof useReadContract>);

    const { result } = renderHook(() =>
      useBTCBalance({ address: mockAddress })
    );

    expect(result.current.isLoading).toBe(true);
    expect(result.current.btcBalance).toBeNull();
    expect(result.current.btcBalanceFormatted).toBeNull();
  });

  it('provides refetch function', () => {
    const mockRefetch = vi.fn();

    vi.mocked(useReadContract).mockReturnValue({
      data: parseEther('0.005'),
      isLoading: false,
      refetch: mockRefetch,
    } as unknown as ReturnType<typeof useReadContract>);

    const { result } = renderHook(() =>
      useBTCBalance({ address: mockAddress })
    );

    expect(result.current.refetch).toBeDefined();
    expect(typeof result.current.refetch).toBe('function');
  });
});
