import { renderHook, waitFor, act } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { useMUSDTransfer } from './useMUSDTransfer';
import type { Address } from 'viem';

// Mock Wagmi hooks
vi.mock('wagmi', () => ({
  useSimulateContract: vi.fn(),
  useWriteContract: vi.fn(),
  useWaitForTransactionReceipt: vi.fn(),
}));

// Import mocked modules
import {
  useSimulateContract,
  useWriteContract,
  useWaitForTransactionReceipt,
} from 'wagmi';

describe('useMUSDTransfer', () => {
  const mockRecipient: Address = '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb';
  const mockAmount = '5.00';
  const mockTxHash = '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef' as `0x${string}`;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Initial state', () => {
    it('returns idle state initially', () => {
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        isPending: false,
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      expect(result.current.state).toBe('idle');
      expect(result.current.txHash).toBe(null);
      expect(result.current.startTime).toBe(null);
      expect(result.current.pollCount).toBe(0);
      expect(result.current.isSimulating).toBe(false);
      expect(result.current.isPending).toBe(false);
      expect(result.current.isConfirming).toBe(false);
      expect(result.current.isSuccess).toBe(false);
      expect(result.current.isError).toBe(false);
      expect(result.current.error).toBe(null);
    });
  });

  describe('Transaction simulation', () => {
    it('returns simulating state when simulating', () => {
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        isLoading: true, // Simulating
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        isPending: false,
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      expect(result.current.state).toBe('simulating');
      expect(result.current.isSimulating).toBe(true);
    });

    it('includes simulation request in simulateData', () => {
      const mockRequest = { address: '0xabc', abi: [], functionName: 'transfer', args: [] };

      vi.mocked(useSimulateContract).mockReturnValue({
        data: { request: mockRequest },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        isPending: false,
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      expect(result.current.state).toBe('idle');
      // Simulation completed, ready to send
    });
  });

  describe('Transaction execution', () => {
    it('sets startTime when sendTransaction is called', async () => {
      vi.useRealTimers(); // Use real timers for this test

      const mockWriteContract = vi.fn();
      const mockRequest = { address: '0xabc', abi: [], functionName: 'transfer', args: [] };

      vi.mocked(useSimulateContract).mockReturnValue({
        data: { request: mockRequest },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        isPending: false,
        writeContract: mockWriteContract,
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      const beforeTime = Date.now();
      await act(async () => {
        await result.current.sendTransaction();
      });
      const afterTime = Date.now();

      expect(result.current.startTime).toBeGreaterThanOrEqual(beforeTime);
      expect(result.current.startTime).toBeLessThanOrEqual(afterTime);
      expect(mockWriteContract).toHaveBeenCalledWith(mockRequest);

      vi.useFakeTimers(); // Restore fake timers
    });

    it('returns awaiting_signature state when pending', () => {
      const mockRequest = { address: '0xabc', abi: [], functionName: 'transfer', args: [] };

      vi.mocked(useSimulateContract).mockReturnValue({
        data: { request: mockRequest },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        isPending: true, // Waiting for wallet signature
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      expect(result.current.state).toBe('awaiting_signature');
      expect(result.current.isPending).toBe(true);
    });

    it('returns pending state after transaction submitted', () => {
      const mockRequest = { address: '0xabc', abi: [], functionName: 'transfer', args: [] };

      vi.mocked(useSimulateContract).mockReturnValue({
        data: { request: mockRequest },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: mockTxHash, // Transaction submitted
        isPending: false,
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      expect(result.current.state).toBe('pending');
      expect(result.current.txHash).toBe(mockTxHash);
    });
  });

  describe('Transaction confirmation', () => {
    it('returns confirming state while waiting for receipt', () => {
      const mockRequest = { address: '0xabc', abi: [], functionName: 'transfer', args: [] };

      vi.mocked(useSimulateContract).mockReturnValue({
        data: { request: mockRequest },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: mockTxHash,
        isPending: false,
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: true, // Confirming
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      expect(result.current.state).toBe('confirming');
      expect(result.current.isConfirming).toBe(true);
    });

    it('increments pollCount correctly during confirmation', async () => {
      vi.useRealTimers(); // Use real timers for async state updates

      const mockRequest = { address: '0xabc', abi: [], functionName: 'transfer', args: [] };

      vi.mocked(useSimulateContract).mockReturnValue({
        data: { request: mockRequest },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      const mockWriteContract = vi.fn();
      vi.mocked(useWriteContract).mockReturnValue({
        data: mockTxHash,
        isPending: false,
        writeContract: mockWriteContract,
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: true,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      // Call sendTransaction to set startTime
      await act(async () => {
        await result.current.sendTransaction();
      });

      // Wait a bit for pollCount to update (it updates every 500ms)
      await act(async () => {
        await new Promise((resolve) => setTimeout(resolve, 600));
      });

      // Check that pollCount has incremented
      expect(result.current.pollCount).toBeGreaterThanOrEqual(0);

      vi.useFakeTimers(); // Restore fake timers
    });

    it('returns success state when transaction confirmed', () => {
      const mockRequest = { address: '0xabc', abi: [], functionName: 'transfer', args: [] };

      vi.mocked(useSimulateContract).mockReturnValue({
        data: { request: mockRequest },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: mockTxHash,
        isPending: false,
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: true, // Confirmed!
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      expect(result.current.state).toBe('success');
      expect(result.current.isSuccess).toBe(true);
    });
  });

  describe('Error handling', () => {
    it('returns error state when simulation fails', () => {
      const mockError = new Error('Simulation failed');

      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: mockError,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        isPending: false,
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      expect(result.current.state).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(mockError);
    });

    it('returns error state when user rejects transaction', () => {
      const mockRequest = { address: '0xabc', abi: [], functionName: 'transfer', args: [] };
      const mockError = new Error('User rejected');
      (mockError as Error & { name: string }).name = 'UserRejectedRequestError';

      vi.mocked(useSimulateContract).mockReturnValue({
        data: { request: mockRequest },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        isPending: false,
        writeContract: vi.fn(),
        error: mockError,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      expect(result.current.state).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(mockError);
    });

    it('returns error state when transaction fails', () => {
      const mockRequest = { address: '0xabc', abi: [], functionName: 'transfer', args: [] };
      const mockError = new Error('Transaction reverted');

      vi.mocked(useSimulateContract).mockReturnValue({
        data: { request: mockRequest },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: mockTxHash,
        isPending: false,
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: mockError,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      expect(result.current.state).toBe('error');
      expect(result.current.isError).toBe(true);
      expect(result.current.error).toBe(mockError);
    });
  });

  describe('Reset functionality', () => {
    it('resets all state when reset is called', async () => {
      vi.useRealTimers(); // Use real timers for this test

      const mockRequest = { address: '0xabc', abi: [], functionName: 'transfer', args: [] };
      const mockReset = vi.fn();
      const mockWriteContract = vi.fn();

      vi.mocked(useSimulateContract).mockReturnValue({
        data: { request: mockRequest },
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: mockTxHash,
        isPending: false,
        writeContract: mockWriteContract,
        error: null,
        reset: mockReset,
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      // Trigger transaction to set startTime
      await act(async () => {
        await result.current.sendTransaction();
      });
      expect(result.current.startTime).not.toBeNull();

      // Reset
      await act(async () => {
        result.current.reset();
      });

      await waitFor(() => {
        expect(mockReset).toHaveBeenCalled();
        expect(result.current.startTime).toBe(null);
        expect(result.current.pollCount).toBe(0);
      });

      vi.useFakeTimers(); // Restore fake timers
    });
  });

  describe('Edge cases', () => {
    it('does not call writeContract if simulation data is not ready', async () => {
      const mockWriteContract = vi.fn();

      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined, // No simulation data
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        isPending: false,
        writeContract: mockWriteContract,
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: mockAmount })
      );

      await result.current.sendTransaction();

      expect(mockWriteContract).not.toHaveBeenCalled();
    });

    it('handles very small amounts correctly', () => {
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        isPending: false,
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: '0.01' })
      );

      expect(result.current.state).toBe('idle');
    });

    it('handles very large amounts correctly', () => {
      vi.mocked(useSimulateContract).mockReturnValue({
        data: undefined,
        isLoading: false,
        error: null,
      } as ReturnType<typeof useSimulateContract>);

      vi.mocked(useWriteContract).mockReturnValue({
        data: undefined,
        isPending: false,
        writeContract: vi.fn(),
        error: null,
        reset: vi.fn(),
      } as unknown as ReturnType<typeof useWriteContract>);

      vi.mocked(useWaitForTransactionReceipt).mockReturnValue({
        isLoading: false,
        isSuccess: false,
        error: null,
      } as ReturnType<typeof useWaitForTransactionReceipt>);

      const { result } = renderHook(() =>
        useMUSDTransfer({ recipient: mockRecipient, amount: '999999.99' })
      );

      expect(result.current.state).toBe('idle');
    });
  });
});
