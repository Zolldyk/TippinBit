import { useQuery } from '@tanstack/react-query';
import { useDebounce } from './useDebounce';
import type { UsernameAvailability } from '@/types/domain';

/**
 * Custom hook to check username availability in real-time.
 *
 * Features:
 * - Debounces input by 500ms to prevent excessive API calls
 * - Caches results for 5 minutes using TanStack Query
 * - Handles API responses: 404 = available, 200 = taken
 * - Gracefully handles errors (returns "unknown" state)
 *
 * @param username - The username to check (with or without @ prefix)
 * @returns Object with availability status
 *
 * @example
 * ```typescript
 * function UsernameForm() {
 *   const [username, setUsername] = useState('');
 *   const { status } = useUsernameAvailability(username);
 *
 *   return (
 *     <div>
 *       <input value={username} onChange={(e) => setUsername(e.target.value)} />
 *       {status === 'available' && <span>✓ Available!</span>}
 *       {status === 'taken' && <span>✗ Already taken</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUsernameAvailability(username: string): {
  status: UsernameAvailability;
} {
  // Debounce username input by 500ms to prevent excessive API calls
  const debouncedUsername = useDebounce(username, 500);

  // Remove @ prefix if present for API call
  const cleanUsername = debouncedUsername.replace(/^@/, '');

  const { data, isLoading, error } = useQuery({
    queryKey: ['username-availability', cleanUsername],
    queryFn: async () => {
      const response = await fetch(
        `/.netlify/functions/username-lookup?username=${encodeURIComponent(cleanUsername)}`
      );

      // 404 = username not found = available
      if (response.status === 404) {
        return { available: true };
      }

      // 200 = username found = taken
      if (response.ok) {
        return { available: false };
      }

      // Any other status = error
      throw new Error('Failed to check availability');
    },
    // Only run query if username is at least 3 characters
    enabled: cleanUsername.length >= 3,
    // Cache results for 5 minutes
    staleTime: 5 * 60 * 1000,
    // Don't retry on failure (treat as "unknown" state)
    retry: false,
  });

  // Determine status based on query state
  if (username.length < 3) {
    return { status: 'idle' };
  }

  if (isLoading || username !== debouncedUsername) {
    return { status: 'checking' };
  }

  if (error) {
    return { status: 'unknown' };
  }

  if (data?.available) {
    return { status: 'available' };
  }

  return { status: 'taken' };
}
