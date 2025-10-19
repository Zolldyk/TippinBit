import { renderHook, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useUsernameClaim } from './useUsernameClaim';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import type { Address } from 'viem';

// Mock wagmi hooks
const mockSignMessageAsync = vi.fn();
const mockUseAccount = vi.fn();
const mockUseSignMessage = vi.fn();

vi.mock('wagmi', () => ({
  useAccount: () => mockUseAccount(),
  useSignMessage: () => mockUseSignMessage(),
}));

// Create wrapper for TanStack Query
function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: {
        retry: false,
      },
      mutations: {
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

  Wrapper.displayName = 'TanStackQueryWrapper';

  return Wrapper;
}

describe('useUsernameClaim', () => {
  const mockAddress = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb' as Address;
  const mockSignature = '0xabcdef123456...';

  beforeEach(() => {
    vi.clearAllMocks();
    global.fetch = vi.fn();

    // Default mocks - wallet connected
    mockUseAccount.mockReturnValue({
      address: mockAddress,
      isConnected: true,
    });

    mockSignMessageAsync.mockResolvedValue(mockSignature);
    mockUseSignMessage.mockReturnValue({
      signMessageAsync: mockSignMessageAsync,
    });
  });

  it('successfully claims available username', async () => {
    // Mock successful claim response
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        username: 'alice',
        walletAddress: mockAddress,
      }),
    });

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    // Trigger claim
    result.current.claimUsername({ username: 'alice' });

    // Wait for mutation to complete
    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    // Verify signature message format
    expect(mockSignMessageAsync).toHaveBeenCalledWith({
      message: 'I claim @alice on TippinBit',
    });

    // Verify API call
    expect(global.fetch).toHaveBeenCalledWith(
      '/.netlify/functions/username-claim',
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'alice',
          walletAddress: mockAddress,
          message: 'I claim @alice on TippinBit',
          signature: mockSignature,
        }),
      }
    );

    // Verify success data
    expect(result.current.data).toEqual({
      success: true,
      username: 'alice',
      walletAddress: mockAddress,
    });
  });

  it('removes @ prefix before generating message', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        username: 'alice',
        walletAddress: mockAddress,
      }),
    });

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    result.current.claimUsername({ username: '@alice' });

    await waitFor(() => {
      expect(mockSignMessageAsync).toHaveBeenCalledWith({
        message: 'I claim @alice on TippinBit',
      });
    });
  });

  it('handles 409 conflict (race condition) error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({
        error: 'Username already claimed',
        code: 'USERNAME_TAKEN',
      }),
    });

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    result.current.claimUsername({ username: 'alice' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.code).toBe('USERNAME_TAKEN');
    expect(result.current.error?.message).toBe(
      'Someone just claimed this username. Try another.'
    );
  });

  it('handles 401 invalid signature error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE',
      }),
    });

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    result.current.claimUsername({ username: 'alice' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.code).toBe('INVALID_SIGNATURE');
    expect(result.current.error?.message).toBe(
      'Signature verification failed. Please try again.'
    );
  });

  it('handles 400 validation error', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 400,
      json: async () => ({
        error: 'Invalid username format',
        code: 'VALIDATION_ERROR',
      }),
    });

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    result.current.claimUsername({ username: 'ab' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.code).toBe('VALIDATION_ERROR');
  });

  it('prompts wallet connection if not connected', async () => {
    // Mock wallet not connected
    mockUseAccount.mockReturnValue({
      address: undefined,
      isConnected: false,
    });

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    result.current.claimUsername({ username: 'alice' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.code).toBe('WALLET_NOT_CONNECTED');
    expect(result.current.error?.message).toBe(
      'Please connect your wallet to claim a username'
    );

    // Should not call signature or API
    expect(mockSignMessageAsync).not.toHaveBeenCalled();
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('handles user rejecting signature request', async () => {
    // Mock user rejecting signature
    mockSignMessageAsync.mockRejectedValue(new Error('User rejected'));

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    result.current.claimUsername({ username: 'alice' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.code).toBe('USER_REJECTED');
    expect(result.current.error?.message).toBe(
      'Signature request was rejected'
    );

    // Should not call API
    expect(global.fetch).not.toHaveBeenCalled();
  });

  it('includes username, address, message, and signature in POST request', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({
        success: true,
        username: 'alice',
        walletAddress: mockAddress,
      }),
    });

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    result.current.claimUsername({ username: 'alice' });

    await waitFor(() => {
      expect(result.current.isSuccess).toBe(true);
    });

    const fetchCall = (global.fetch as ReturnType<typeof vi.fn>).mock
      .calls[0];

    expect(fetchCall).toBeDefined();
    expect(fetchCall?.[1]).toBeDefined();

    const requestBody = JSON.parse(fetchCall![1].body as string);

    expect(requestBody).toEqual({
      username: 'alice',
      walletAddress: mockAddress,
      message: 'I claim @alice on TippinBit',
      signature: mockSignature,
    });
  });

  it('handles network errors', async () => {
    global.fetch = vi.fn().mockRejectedValue(new Error('Network error'));

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    result.current.claimUsername({ username: 'alice' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    // Should still complete signature before network error
    expect(mockSignMessageAsync).toHaveBeenCalled();
  });

  it('handles malformed JSON response gracefully', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => {
        throw new Error('Invalid JSON');
      },
    });

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    result.current.claimUsername({ username: 'alice' });

    await waitFor(() => {
      expect(result.current.isError).toBe(true);
    });

    expect(result.current.error?.code).toBe('UNKNOWN_ERROR');
  });

  it('sets isPending state during claim process', async () => {
    global.fetch = vi.fn().mockImplementation(
      () =>
        new Promise((resolve) =>
          setTimeout(
            () =>
              resolve({
                ok: true,
                status: 200,
                json: async () => ({
                  success: true,
                  username: 'alice',
                  walletAddress: mockAddress,
                }),
              }),
            100
          )
        )
    );

    const { result } = renderHook(() => useUsernameClaim(), {
      wrapper: createWrapper(),
    });

    expect(result.current.isPending).toBe(false);

    result.current.claimUsername({ username: 'alice' });

    // Should be pending immediately
    await waitFor(() => {
      expect(result.current.isPending).toBe(true);
    });

    // Should complete
    await waitFor(
      () => {
        expect(result.current.isPending).toBe(false);
        expect(result.current.isSuccess).toBe(true);
      },
      { timeout: 200 }
    );
  });
});
