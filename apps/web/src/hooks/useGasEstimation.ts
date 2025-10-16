'use client';

import { useState, useEffect } from 'react';
import { type Address, encodeFunctionData, formatEther, erc20Abi } from 'viem';
import { usePublicClient } from 'wagmi';
import { useDebounce } from './useDebounce';
import { MUSD_ADDRESS } from '@/config/contracts';

// Fixed ETH price for MVP (in USD)
const ETH_PRICE_USD = 3000;

// Auto-refresh interval (30 seconds)
const REFRESH_INTERVAL_MS = 30000;

// Debounce delay for amount changes (500ms)
const AMOUNT_DEBOUNCE_MS = 500;

// Default fallback gas limit (200,000 gas units)
// Standard ERC-20 transfer is 50k-150k, using 200k provides safe buffer
const FALLBACK_GAS_LIMIT = BigInt(200000);

interface UseGasEstimationParams {
  amount: bigint;
  recipientAddress: Address;
}

interface UseGasEstimationReturn {
  gasEstimate: bigint | null;
  gasEstimateUsd: string | null;
  isLoading: boolean;
  gasEstimationFailed: boolean;
  error: Error | null;
  refetch: () => void;
}

/**
 * Hook for estimating gas costs for MUSD transfer transactions.
 * Automatically refreshes every 30 seconds and debounces amount changes.
 *
 * @param params - Amount and recipient address for gas estimation
 * @returns Gas estimate in wei and USD, loading state, and error state
 *
 * @example
 * const { gasEstimateUsd, isLoading, error } = useGasEstimation({
 *   amount: parseEther('5'),
 *   recipientAddress: '0x...'
 * });
 */
export function useGasEstimation({
  amount,
  recipientAddress,
}: UseGasEstimationParams): UseGasEstimationReturn {
  const publicClient = usePublicClient();
  const [gasEstimate, setGasEstimate] = useState<bigint | null>(null);
  const [gasEstimateUsd, setGasEstimateUsd] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [gasEstimationFailed, setGasEstimationFailed] = useState<boolean>(false);
  const [error, setError] = useState<Error | null>(null);
  const [refetchTrigger, setRefetchTrigger] = useState<number>(0);

  // Debounce amount to avoid excessive RPC calls while user types
  const debouncedAmount = useDebounce(amount, AMOUNT_DEBOUNCE_MS);

  // Refetch function
  const refetch = () => {
    setRefetchTrigger((prev) => prev + 1);
  };

  useEffect(() => {
    // Skip if no public client or invalid inputs
    if (!publicClient || !MUSD_ADDRESS || debouncedAmount === BigInt(0)) {
      setIsLoading(false);
      setGasEstimate(null);
      setGasEstimateUsd(null);
      return;
    }

    let isCancelled = false;

    const estimateGas = async () => {
      try {
        setIsLoading(true);
        setError(null);

        // Encode transfer function data
        const data = encodeFunctionData({
          abi: erc20Abi,
          functionName: 'transfer',
          args: [recipientAddress, debouncedAmount],
        });

        // Estimate gas for the transaction
        const gasAmount = await publicClient.estimateGas({
          to: MUSD_ADDRESS,
          data,
        });

        // Get current gas price
        const gasPrice = await publicClient.getGasPrice();

        // Calculate total gas cost in wei
        const gasCostWei = gasAmount * gasPrice;

        // Convert to ETH
        const gasCostEth = formatEther(gasCostWei);

        // Convert to USD using fixed price
        const gasCostUsd = Number(gasCostEth) * ETH_PRICE_USD;

        if (!isCancelled) {
          setGasEstimate(gasCostWei);
          setGasEstimateUsd(gasCostUsd.toFixed(2));
          setIsLoading(false);
        }
      } catch (err) {
        if (!isCancelled) {
          setError(
            err instanceof Error ? err : new Error('Failed to estimate gas')
          );
          setGasEstimationFailed(true);

          // Use fallback gas limit
          try {
            const gasPrice = await publicClient.getGasPrice();
            const fallbackGasCostWei = FALLBACK_GAS_LIMIT * gasPrice;
            const fallbackGasCostEth = formatEther(fallbackGasCostWei);
            const fallbackGasCostUsd = Number(fallbackGasCostEth) * ETH_PRICE_USD;

            setGasEstimate(fallbackGasCostWei);
            setGasEstimateUsd(fallbackGasCostUsd.toFixed(2));
          } catch {
            // If even fallback fails, set null
            setGasEstimate(null);
            setGasEstimateUsd(null);
          }

          setIsLoading(false);
        }
      }
    };

    // Initial estimation
    estimateGas();

    // Set up auto-refresh interval
    const intervalId = setInterval(() => {
      estimateGas();
    }, REFRESH_INTERVAL_MS);

    // Cleanup
    return () => {
      isCancelled = true;
      clearInterval(intervalId);
    };
  }, [publicClient, debouncedAmount, recipientAddress, refetchTrigger]);

  return {
    gasEstimate,
    gasEstimateUsd,
    isLoading,
    gasEstimationFailed,
    error,
    refetch,
  };
}
