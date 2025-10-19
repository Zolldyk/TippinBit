import { useQuery } from '@tanstack/react-query';
import type {
  UsernameResolutionResult,
  UsernameLookupResponse,
} from '@/types/domain';
import {
  getUsernameResolution,
  setUsernameResolution,
} from '@/lib/session-storage';

/**
 * Custom hook for resolving username to wallet address
 *
 * Implements cache-first strategy using session storage (5-minute TTL).
 * Falls back to API call if cache miss or expired.
 *
 * @param username - Username to resolve (with or without @ prefix)
 * @returns Resolution result with status, address, and error info
 */
export function useUsernameResolution(
  username: string
): UsernameResolutionResult {
  // Strip @ prefix for API call and cache key
  const cleanUsername = username.replace(/^@/, '');

  // Check session storage cache first
  const cached = getUsernameResolution(cleanUsername);

  const { data, isLoading, error } = useQuery({
    queryKey: ['username-resolution', cleanUsername],
    queryFn: async (): Promise<UsernameLookupResponse> => {
      const response = await fetch(
        `/.netlify/functions/username-lookup?username=${encodeURIComponent(cleanUsername)}`
      );

      if (response.status === 404) {
        throw new Error('USERNAME_NOT_FOUND');
      }

      if (!response.ok) {
        throw new Error('NETWORK_ERROR');
      }

      return response.json();
    },
    enabled: !cached, // Skip API call if cached
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: (failureCount, error) => {
      // Don't retry on 404 (username not found)
      if ((error as Error).message === 'USERNAME_NOT_FOUND') {
        return false;
      }
      // Retry network errors up to 2 times
      return failureCount < 2;
    },
  });

  // Use cached data if available
  if (cached && !error) {
    return {
      status: 'success',
      address: cached.address,
      username: `@${cached.username}` as `@${string}`,
    };
  }

  if (isLoading) {
    return { status: 'loading' };
  }

  if (error) {
    if ((error as Error).message === 'USERNAME_NOT_FOUND') {
      return { status: 'not_found' };
    }
    return { status: 'error', error: (error as Error).message };
  }

  // Save to session storage on success
  if (data) {
    setUsernameResolution(data.username, data.walletAddress);

    return {
      status: 'success',
      address: data.walletAddress,
      username: `@${data.username}` as `@${string}`,
      claimedAt: data.claimedAt,
    };
  }

  return { status: 'idle' };
}
