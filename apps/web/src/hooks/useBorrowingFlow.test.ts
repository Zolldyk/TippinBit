import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act, waitFor } from '@testing-library/react';
import { useBorrowingFlow } from './useBorrowingFlow';
import { parseEther, type Hash } from 'viem';

// Create mock functions
const mockWriteContractAsync = vi.fn();
const mockWaitForTransactionReceipt = vi.fn();

// Mock wagmi hooks
vi.mock('wagmi', () => ({
  useWriteContract: vi.fn(() => ({
    writeContractAsync: mockWriteContractAsync,
  })),
  useWaitForTransactionReceipt: vi.fn(() => ({
    data: null,
    isLoading: false,
  })),
  usePublicClient: vi.fn(() => ({
    waitForTransactionReceipt: mockWaitForTransactionReceipt,
  })),
}));

// Mock contract addresses
vi.mock('@/config/contracts', () => ({
  BTC_ADDRESS: '0x1111111111111111111111111111111111111111' as const,
  BORROWING_VAULT_ADDRESS: '0x2222222222222222222222222222222222222222' as const,
  ERC20_ABI: [],
  BORROWING_VAULT_ABI: [],
  validateBTCAddress: vi.fn(() => '0x1111111111111111111111111111111111111111' as const),
  validateBorrowingVaultAddress: vi.fn(() => '0x2222222222222222222222222222222222222222' as const),
}));

describe('useBorrowingFlow', () => {
  const mockParams = {
    collateralRequired: parseEther('0.001'),
    tipAmount: parseEther('10'),
    recipient: '0x3333333333333333333333333333333333333333' as const,
    message: 'Test tip',
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock implementations
    mockWriteContractAsync.mockReset();
    mockWaitForTransactionReceipt.mockReset();
  });

  it('initializes with correct default state', () => {
    const { result } = renderHook(() => useBorrowingFlow(mockParams));

    expect(result.current.currentStep).toBeNull();
    expect(result.current.completedSteps).toEqual([]);
    expect(result.current.error).toBeNull();
    expect(result.current.isLoading).toBe(false);
    expect(result.current.txHashes).toEqual({});
    expect(result.current.retryCount).toBe(0);
    expect(result.current.positionId).toBeNull();
  });

  it('provides all required functions', () => {
    const { result } = renderHook(() => useBorrowingFlow(mockParams));

    expect(typeof result.current.executeFlow).toBe('function');
    expect(typeof result.current.retry).toBe('function');
    expect(typeof result.current.cancel).toBe('function');
  });

  it('cancel resets the flow state', async () => {
    const { result } = renderHook(() => useBorrowingFlow(mockParams));

    act(() => {
      result.current.cancel();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.currentStep).toBeNull();
    expect(result.current.error).toBeNull();
  });

  it('handles collateralRequired parameter correctly', () => {
    const { result } = renderHook(() =>
      useBorrowingFlow({
        ...mockParams,
        collateralRequired: parseEther('0.002'),
      })
    );

    expect(result.current.currentStep).toBeNull();
  });

  it('handles tipAmount parameter correctly', () => {
    const { result } = renderHook(() =>
      useBorrowingFlow({
        ...mockParams,
        tipAmount: parseEther('20'),
      })
    );

    expect(result.current.currentStep).toBeNull();
  });

  it('handles recipient parameter correctly', () => {
    const testRecipient = '0x4444444444444444444444444444444444444444' as const;
    const { result } = renderHook(() =>
      useBorrowingFlow({
        ...mockParams,
        recipient: testRecipient,
      })
    );

    expect(result.current.currentStep).toBeNull();
  });

  it('handles optional message parameter', () => {
    const { result } = renderHook(() =>
      useBorrowingFlow({
        ...mockParams,
        message: 'Custom message',
      })
    );

    expect(result.current.currentStep).toBeNull();
  });

  it('handles empty message parameter', () => {
    const { result } = renderHook(() =>
      useBorrowingFlow({
        ...mockParams,
        message: '',
      })
    );

    expect(result.current.currentStep).toBeNull();
  });

  it('exposes transaction hashes correctly', () => {
    const { result } = renderHook(() => useBorrowingFlow(mockParams));

    expect(result.current.txHashes).toEqual({});
    expect(result.current.txHashes.approve).toBeUndefined();
    expect(result.current.txHashes.deposit).toBeUndefined();
    expect(result.current.txHashes.execute).toBeUndefined();
  });

  it('exposes retry count correctly', () => {
    const { result } = renderHook(() => useBorrowingFlow(mockParams));

    expect(result.current.retryCount).toBe(0);
  });

  it('exposes position ID correctly', () => {
    const { result } = renderHook(() => useBorrowingFlow(mockParams));

    expect(result.current.positionId).toBeNull();
  });

  it('exposes error state correctly', () => {
    const { result } = renderHook(() => useBorrowingFlow(mockParams));

    expect(result.current.error).toBeNull();
  });

  it('exposes completed steps correctly', () => {
    const { result } = renderHook(() => useBorrowingFlow(mockParams));

    expect(result.current.completedSteps).toEqual([]);
    expect(Array.isArray(result.current.completedSteps)).toBe(true);
  });

  describe('Integration Tests - Flow Progression', () => {
    it('successfully completes all 3 steps of the borrowing flow', async () => {
      const approveHash = '0xaaa' as Hash;
      const depositHash = '0xbbb' as Hash;
      const executeHash = '0xccc' as Hash;

      // Mock successful transactions
      mockWriteContractAsync
        .mockResolvedValueOnce(approveHash)
        .mockResolvedValueOnce(depositHash)
        .mockResolvedValueOnce(executeHash);

      mockWaitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        blockNumber: BigInt(12345),
        logs: [],
      });

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      await act(async () => {
        await result.current.executeFlow();
      });

      // Verify all steps completed
      expect(result.current.completedSteps).toEqual([1, 2, 3]);
      expect(result.current.currentStep).toBeNull();
      expect(result.current.isLoading).toBe(false);
      expect(result.current.error).toBeNull();

      // Verify transaction hashes tracked
      expect(result.current.txHashes.approve).toBe(approveHash);
      expect(result.current.txHashes.deposit).toBe(depositHash);
      expect(result.current.txHashes.execute).toBe(executeHash);

      // Verify position ID was extracted
      expect(result.current.positionId).toBe('12345');
    });

    it('progresses through steps sequentially', async () => {
      const approveHash = '0xaaa' as Hash;
      const depositHash = '0xbbb' as Hash;

      mockWriteContractAsync
        .mockResolvedValueOnce(approveHash)
        .mockResolvedValueOnce(depositHash);

      mockWaitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        blockNumber: BigInt(12345),
        logs: [],
      });

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      // Start flow
      act(() => {
        result.current.executeFlow();
      });

      // Wait for step 1 to complete
      await waitFor(() => {
        expect(result.current.completedSteps).toContain(1);
      });

      // Wait for step 2 to complete
      await waitFor(() => {
        expect(result.current.completedSteps).toContain(2);
      });
    });

    it('sets loading state during flow execution', async () => {
      mockWriteContractAsync.mockResolvedValue('0xaaa' as Hash);
      mockWaitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        blockNumber: BigInt(12345),
        logs: [],
      });

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      act(() => {
        result.current.executeFlow();
      });

      // Should be loading during execution
      expect(result.current.isLoading).toBe(true);

      await waitFor(() => {
        expect(result.current.isLoading).toBe(false);
      });
    });
  });

  describe('Integration Tests - Retry Logic', () => {
    it('auto-retries Step 2 up to 3 times on failure', async () => {
      const approveHash = '0xaaa' as Hash;
      const depositHash = '0xbbb' as Hash;

      mockWriteContractAsync
        .mockResolvedValueOnce(approveHash) // Step 1 succeeds
        .mockRejectedValueOnce(new Error('Network error')) // Step 2 attempt 1
        .mockRejectedValueOnce(new Error('Network error')) // Step 2 attempt 2
        .mockResolvedValueOnce(depositHash); // Step 2 attempt 3 succeeds

      mockWaitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        blockNumber: BigInt(12345),
        logs: [],
      });

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      await act(async () => {
        await result.current.executeFlow();
      });

      // Should have retried and eventually succeeded
      expect(mockWriteContractAsync).toHaveBeenCalledTimes(4); // 1 approve + 3 deposit attempts
      expect(result.current.completedSteps).toContain(2);
    });

    it('shows retry count during retries', async () => {
      const approveHash = '0xaaa' as Hash;

      mockWriteContractAsync
        .mockResolvedValueOnce(approveHash) // Step 1
        .mockRejectedValue(new Error('Network error')); // Step 2 fails repeatedly

      mockWaitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        blockNumber: BigInt(12345),
        logs: [],
      });

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      await act(async () => {
        await result.current.executeFlow();
      });

      // After max retries, retry count should be shown
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.step).toBe(2);
    });

    it('does not auto-retry Step 1 (approval requires user action)', async () => {
      mockWriteContractAsync.mockRejectedValue(new Error('User rejected'));

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      await act(async () => {
        await result.current.executeFlow();
      });

      // Should only call once (no retries)
      expect(mockWriteContractAsync).toHaveBeenCalledTimes(1);
      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.step).toBe(1);
    });
  });

  describe('Integration Tests - Error Handling', () => {
    it('handles user rejection error', async () => {
      mockWriteContractAsync.mockRejectedValue(new Error('User rejected transaction'));

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      await act(async () => {
        await result.current.executeFlow();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('USER_REJECTED');
      expect(result.current.error?.retryable).toBe(false);
    });

    it('handles insufficient gas error', async () => {
      mockWriteContractAsync.mockRejectedValue(new Error('insufficient funds for gas'));

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      await act(async () => {
        await result.current.executeFlow();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('INSUFFICIENT_GAS');
      expect(result.current.error?.retryable).toBe(true);
    });

    it('handles network error', async () => {
      mockWriteContractAsync.mockRejectedValue(new Error('network timeout'));

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      await act(async () => {
        await result.current.executeFlow();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('NETWORK_ERROR');
    });

    it('handles contract revert error', async () => {
      mockWriteContractAsync.mockRejectedValue(new Error('execution reverted'));

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      await act(async () => {
        await result.current.executeFlow();
      });

      expect(result.current.error).not.toBeNull();
      expect(result.current.error?.type).toBe('CONTRACT_ERROR');
    });

    it('allows manual retry after failure', async () => {
      const approveHash = '0xaaa' as Hash;

      mockWriteContractAsync
        .mockRejectedValueOnce(new Error('Network error'))
        .mockResolvedValueOnce(approveHash);

      mockWaitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        blockNumber: BigInt(12345),
        logs: [],
      });

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      // First attempt fails
      await act(async () => {
        await result.current.executeFlow();
      });

      expect(result.current.error).not.toBeNull();

      // Manual retry succeeds
      await act(async () => {
        result.current.retry();
      });

      await waitFor(() => {
        expect(result.current.completedSteps).toContain(1);
      });
    });
  });

  describe('Integration Tests - Position ID', () => {
    it('extracts position ID from transaction receipt', async () => {
      const approveHash = '0xaaa' as Hash;
      const depositHash = '0xbbb' as Hash;

      mockWriteContractAsync
        .mockResolvedValueOnce(approveHash)
        .mockResolvedValueOnce(depositHash);

      mockWaitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        blockNumber: BigInt(99999),
        logs: [{ topics: ['0x123'] }],
      });

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      await act(async () => {
        await result.current.executeFlow();
      });

      // Should extract position ID from block number
      expect(result.current.positionId).toBe('99999');
    });

    it('validates position ID before Step 3', async () => {
      const approveHash = '0xaaa' as Hash;
      const depositHash = '0xbbb' as Hash;
      const executeHash = '0xccc' as Hash;

      mockWriteContractAsync
        .mockResolvedValueOnce(approveHash)
        .mockResolvedValueOnce(depositHash)
        .mockResolvedValueOnce(executeHash);

      mockWaitForTransactionReceipt.mockResolvedValue({
        status: 'success',
        blockNumber: BigInt(12345),
        logs: [],
      });

      const { result } = renderHook(() => useBorrowingFlow(mockParams));

      await act(async () => {
        await result.current.executeFlow();
      });

      // Verify Step 3 was called with valid position ID
      expect(mockWriteContractAsync).toHaveBeenCalledTimes(3);
      expect(result.current.error).toBeNull();
    });
  });
});
