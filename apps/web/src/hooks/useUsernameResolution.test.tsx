import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useUsernameResolution } from './useUsernameResolution';
import type { ReactNode } from 'react';

// Mock session storage
const sessionStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: vi.fn((key: string) => store[key] || null),
    setItem: vi.fn((key: string, value: string) => {
      store[key] = value;
    }),
    removeItem: vi.fn((key: string) => {
      delete store[key];
    }),
    clear: vi.fn(() => {
      store = {};
    }),
  };
})();

Object.defineProperty(window, 'sessionStorage', {
  value: sessionStorageMock,
});

// Create wrapper for React Query
const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false, // Disable retries for tests
      },
    },
  });

  return function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    );
  };
};

describe('useUsernameResolution', () => {
  beforeEach(() => {
    // Clear session storage before each test
    sessionStorageMock.clear();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('successfully resolves username (200 response)', async () => {
    // Mock successful API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        username: 'alice',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        claimedAt: '2025-01-15T10:00:00Z',
      }),
    });

    const { result } = renderHook(() => useUsernameResolution('@alice'), {
      wrapper: createWrapper(),
    });

    // Should start in loading state
    expect(result.current.status).toBe('loading');

    // Wait for resolution
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    expect(result.current.username).toBe('@alice');
    expect(result.current.claimedAt).toBe('2025-01-15T10:00:00Z');
  });

  it('returns not_found for unclaimed username (404 response)', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: false,
      status: 404,
      json: async () => ({ error: 'Username not found' }),
    });

    const { result } = renderHook(() => useUsernameResolution('@unclaimed999'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('not_found');
    });
  });

  it('returns error for network failures', async () => {
    // Mock multiple calls for retries (retry happens 2 times)
    global.fetch = vi.fn()
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      })
      .mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Internal server error' }),
      });

    const { result } = renderHook(() => useUsernameResolution('@alice'), {
      wrapper: createWrapper(),
    });

    // Wait for all retries to complete (initial + 2 retries = 3 attempts)
    await waitFor(
      () => {
        expect(result.current.status).toBe('error');
      },
      { timeout: 5000, interval: 100 }
    );

    // Verify all 3 attempts were made (initial + 2 retries)
    expect(global.fetch).toHaveBeenCalledTimes(3);
  });

  it('uses session storage cache on second call (no API call)', async () => {
    // Pre-populate session storage cache
    const cachedData = {
      username: 'alice',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      timestamp: Date.now(),
    };
    sessionStorageMock.setItem(
      'username-resolution:alice',
      JSON.stringify(cachedData)
    );

    const mockFetch = vi.fn();
    global.fetch = mockFetch;

    const { result } = renderHook(() => useUsernameResolution('@alice'), {
      wrapper: createWrapper(),
    });

    // Should immediately return cached data
    expect(result.current.status).toBe('success');
    expect(result.current.address).toBe('0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb');
    expect(result.current.username).toBe('@alice');

    // Fetch should not be called
    expect(mockFetch).not.toHaveBeenCalled();
  });

  it('cache expires after TTL (5 minutes)', async () => {
    // Create expired cache entry (6 minutes old)
    const expiredData = {
      username: 'alice',
      address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
      timestamp: Date.now() - 6 * 60 * 1000, // 6 minutes ago
    };
    sessionStorageMock.setItem(
      'username-resolution:alice',
      JSON.stringify(expiredData)
    );

    // Mock fresh API response
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        username: 'alice',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        claimedAt: '2025-01-15T10:00:00Z',
      }),
    });

    const { result } = renderHook(() => useUsernameResolution('@alice'), {
      wrapper: createWrapper(),
    });

    // Should fetch from API (not use expired cache)
    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(global.fetch).toHaveBeenCalled();
  });

  it('strips @ prefix before API call', async () => {
    const mockFetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        username: 'alice',
        walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
        claimedAt: '2025-01-15T10:00:00Z',
      }),
    });
    global.fetch = mockFetch;

    renderHook(() => useUsernameResolution('@alice'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      const callUrl = mockFetch.mock.calls[0]?.[0] as string;
      expect(callUrl).toContain('username=alice'); // No @ prefix
      expect(callUrl).not.toContain('username=%40alice'); // No URL-encoded @
    });
  });

  it('works with username without @ prefix', async () => {
    global.fetch = vi.fn().mockResolvedValueOnce({
      ok: true,
      status: 200,
      json: async () => ({
        username: 'bob',
        walletAddress: '0x1234567890abcdef1234567890abcdef12345678',
        claimedAt: '2025-01-15T10:00:00Z',
      }),
    });

    const { result } = renderHook(() => useUsernameResolution('bob'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('success');
    });

    expect(result.current.username).toBe('@bob');
  });
});
