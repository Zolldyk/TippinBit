import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUsernameAvailability } from './useUsernameAvailability';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';

// Mock useDebounce hook to return value immediately (no delay in tests)
vi.mock('./useDebounce', () => ({
  useDebounce: vi.fn((value: string) => value),
}));

// Create wrapper for TanStack Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
    },
  });

  function Wrapper({ children }: { children: ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    );
  }

  return Wrapper;
}

describe('useUsernameAvailability', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Clear fetch mocks
    global.fetch = vi.fn();
  });

  it('returns "idle" state for usernames shorter than 3 characters', () => {
    const { result } = renderHook(() => useUsernameAvailability('ab'), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBe('idle');
  });

  it('returns "idle" state for empty username', () => {
    const { result } = renderHook(() => useUsernameAvailability(''), {
      wrapper: createWrapper(),
    });

    expect(result.current.status).toBe('idle');
  });

  it('returns "available" for unclaimed username (404 response)', async () => {
    // Mock 404 response (username not found = available)
    global.fetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    });

    const { result } = renderHook(() => useUsernameAvailability('alice'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('available');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/.netlify/functions/username-lookup?username=alice'
    );
  });

  it('returns "taken" for claimed username (200 response)', async () => {
    // Mock 200 response (username found = taken)
    global.fetch = vi.fn().mockResolvedValue({
      status: 200,
      ok: true,
      json: async () => ({
        username: 'alice',
        walletAddress: '0x123...',
        claimedAt: '2025-01-01T00:00:00Z',
      }),
    });

    const { result } = renderHook(() => useUsernameAvailability('alice'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('taken');
    });

    expect(global.fetch).toHaveBeenCalledWith(
      '/.netlify/functions/username-lookup?username=alice'
    );
  });

  it('returns "unknown" state when API call fails', async () => {
    // Mock network error
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUsernameAvailability('alice'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('unknown');
    });
  });

  it('returns "unknown" state for non-404/200 responses', async () => {
    // Mock 500 server error
    global.fetch = vi.fn().mockResolvedValue({
      status: 500,
      ok: false,
    });

    const { result } = renderHook(() => useUsernameAvailability('alice'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(result.current.status).toBe('unknown');
    });
  });

  it('removes @ prefix from username before API call', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    });

    renderHook(() => useUsernameAvailability('@alice'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/username-lookup?username=alice'
      );
    });
  });

  it('encodes username in URL correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    });

    renderHook(() => useUsernameAvailability('alice_123'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/username-lookup?username=alice_123'
      );
    });
  });

  it('does not call API for usernames shorter than 3 characters', () => {
    global.fetch = vi.fn();

    renderHook(() => useUsernameAvailability('ab'), {
      wrapper: createWrapper(),
    });

    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles special characters in username correctly', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      status: 404,
      ok: false,
    });

    renderHook(() => useUsernameAvailability('alice-bob'), {
      wrapper: createWrapper(),
    });

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        '/.netlify/functions/username-lookup?username=alice-bob'
      );
    });
  });
});
