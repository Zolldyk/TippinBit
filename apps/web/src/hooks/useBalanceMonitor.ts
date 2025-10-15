'use client';

import { useState, useEffect } from 'react';
import { type Address, formatUnits } from 'viem';
import { useBalance } from 'wagmi';

// Refetch interval for balance updates (10 seconds)
const BALANCE_REFETCH_INTERVAL_MS = 10000;

interface UseBalanceMonitorParams {
  address: Address | undefined;
  musdAddress: Address;
}

interface UseBalanceMonitorReturn {
  balance: bigint | null;
  balanceUsd: string | null;
  isLoading: boolean;
  refetch: () => Promise<void>;
  updateOptimistically: (amountSent: bigint) => Promise<void>;
}

/**
 * Hook for monitoring MUSD balance in real-time.
 * Automatically refetches every 10 seconds and supports optimistic updates.
 *
 * @param params - Wallet address and MUSD token address
 * @returns Balance in wei and USD, loading state, refetch function, and optimistic update function
 *
 * @example
 * const { balance, balanceUsd, isLoading, updateOptimistically } = useBalanceMonitor({
 *   address: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb',
 *   musdAddress: '0x...'
 * });
 */
export function useBalanceMonitor({
  address,
  musdAddress,
}: UseBalanceMonitorParams): UseBalanceMonitorReturn {
  const [optimisticBalance, setOptimisticBalance] = useState<bigint | null>(
    null
  );

  // Fetch MUSD balance using Wagmi
  const {
    data: balanceData,
    isLoading,
    refetch: wagmiRefetch,
  } = useBalance({
    address,
    token: musdAddress,
    query: {
      refetchInterval: BALANCE_REFETCH_INTERVAL_MS,
      enabled: !!address, // Only fetch when address is available
    },
  });

  // Compute current balance (optimistic if set, otherwise from chain)
  const balance = optimisticBalance ?? balanceData?.value ?? null;

  // Format balance as USD string with 2 decimals
  const balanceUsd =
    balance !== null ? Number(formatUnits(balance, 18)).toFixed(2) : null;

  // Reset optimistic balance when chain data changes
  useEffect(() => {
    if (balanceData?.value !== undefined && optimisticBalance !== null) {
      // Check if chain balance has caught up with optimistic update
      if (balanceData.value <= optimisticBalance) {
        setOptimisticBalance(null);
      }
    }
  }, [balanceData?.value, optimisticBalance]);

  // Refetch function
  const refetch = async () => {
    setOptimisticBalance(null); // Clear optimistic state
    await wagmiRefetch();
  };

  // Optimistic update function
  const updateOptimistically = async (amountSent: bigint) => {
    if (balance !== null) {
      const newBalance = balance - amountSent;
      setOptimisticBalance(newBalance > BigInt(0) ? newBalance : BigInt(0));

      // Trigger refetch after optimistic update (wait for transaction to propagate)
      await new Promise((resolve) => setTimeout(resolve, 1000));
      await wagmiRefetch();
    }
  };

  return {
    balance,
    balanceUsd,
    isLoading,
    refetch,
    updateOptimistically,
  };
}
