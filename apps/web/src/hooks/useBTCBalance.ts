import { useReadContract } from 'wagmi';
import { formatUnits, type Address } from 'viem';
import { BTC_ADDRESS, ERC20_ABI } from '@/config/contracts';

export interface UseBTCBalanceProps {
  address: Address | undefined;
}

export interface UseBTCBalanceReturn {
  btcBalance: bigint | null;
  btcBalanceFormatted: string | null;
  isLoading: boolean;
  refetch: () => void;
}

/**
 * Hook to monitor BTC token balance on Mezo testnet
 *
 * @param address - Wallet address to monitor
 * @returns BTC balance (bigint), formatted string, loading state, refetch function
 *
 * @example
 * const { btcBalance, btcBalanceFormatted, isLoading } = useBTCBalance({ address: walletAddress });
 */
export function useBTCBalance({ address }: UseBTCBalanceProps): UseBTCBalanceReturn {
  const {
    data: balance,
    isLoading,
    refetch,
  } = useReadContract({
    address: BTC_ADDRESS,
    abi: ERC20_ABI,
    functionName: 'balanceOf',
    args: address ? [address] : undefined,
    query: {
      enabled: !!address && !!BTC_ADDRESS,
      refetchInterval: 10000, // Refetch every 10 seconds
    },
  });

  // Debug logging for BTC balance detection
  console.log('[useBTCBalance] Debug Info:', {
    walletAddress: address,
    btcContractAddress: BTC_ADDRESS,
    queryEnabled: !!address && !!BTC_ADDRESS,
    rawBalance: balance,
    isLoading,
    isBTCAddressConfigured: !!BTC_ADDRESS,
  });

  // Format balance from wei (18 decimals) to display string
  const btcBalanceFormatted = balance
    ? parseFloat(formatUnits(balance, 18)).toFixed(6) // Show 6 decimals for BTC
    : null;

  if (balance !== undefined) {
    console.log('[useBTCBalance] Balance detected:', {
      raw: balance.toString(),
      formatted: btcBalanceFormatted,
    });
  }

  return {
    btcBalance: balance ?? null,
    btcBalanceFormatted,
    isLoading,
    refetch,
  };
}
