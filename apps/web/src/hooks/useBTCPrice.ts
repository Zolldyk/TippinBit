import { useQuery } from '@tanstack/react-query';
import { BORROWING_CONFIG } from '@/lib/btc-calculations';

interface BTCPriceResponse {
  price: number;
  timestamp: number;
  source: 'CoinGecko' | 'Cache';
  cached: boolean;
}

interface UseBTCPriceReturn {
  btcPrice: bigint | null; // Price scaled by 1e18 for calculations
  btcPriceUsd: number | null; // Price in USD (for display)
  isStale: boolean; // True if >10 minutes old
  isFetching: boolean; // Loading state
  isError: boolean; // Error state
  error: Error | null; // Error object
  refetch: () => void; // Manual refetch function
  timestamp: number | null; // Last update timestamp
}

/**
 * Hook to fetch and manage BTC price data
 *
 * Fetches BTC price from Netlify function (backed by CoinGecko API + Redis cache).
 * Automatically refetches every 2 minutes and detects stale data (>10 minutes old).
 * Includes price validation and retry logic.
 *
 * @returns BTC price data and state
 *
 * @example
 * const { btcPrice, isStale, isFetching, refetch } = useBTCPrice();
 *
 * if (isFetching && !btcPrice) {
 *   return <div>Loading price...</div>;
 * }
 *
 * if (isStale) {
 *   return <div>Price may be outdated <button onClick={refetch}>Refresh</button></div>;
 * }
 */
export function useBTCPrice(): UseBTCPriceReturn {
  const query = useQuery({
    queryKey: ['btc-price'],
    queryFn: async () => {
      const response = await fetch('/.netlify/functions/btc-price/btc-price');
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      const data = (await response.json()) as BTCPriceResponse;

      // Validate price is within reasonable range
      if (data.price < 10000 || data.price > 200000) {
        throw new Error(
          `Invalid BTC price: ${data.price}. Expected between $10,000 and $200,000.`
        );
      }

      return data;
    },
    refetchInterval: 120_000, // Refetch every 2 minutes
    staleTime: 300_000, // Consider stale after 5 minutes
    retry: 3, // Retry failed requests 3 times
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000), // Exponential backoff
  });

  const btcPriceUsd = query.data?.price ?? null;

  // Convert price from number to bigint with 1e18 scaling for calculations
  // CRITICAL: This ensures all calculations work correctly with bigint arithmetic
  const btcPrice = btcPriceUsd
    ? BigInt(Math.floor(btcPriceUsd * 1e18))
    : null;

  const timestamp = query.data?.timestamp ?? null;

  // Check if price is stale (>10 minutes old)
  const isStale = timestamp
    ? Date.now() - timestamp > BORROWING_CONFIG.PRICE_STALENESS_THRESHOLD
    : false;

  return {
    btcPrice,
    btcPriceUsd,
    isStale,
    isFetching: query.isFetching,
    isError: query.isError,
    error: query.error,
    refetch: query.refetch,
    timestamp,
  };
}
