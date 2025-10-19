import { useMutation } from '@tanstack/react-query';
import { useAccount, useSignMessage } from 'wagmi';
import type {
  UsernameClaimRequest,
  UsernameClaimResponse,
} from '@/types/domain';

/**
 * Error class for username claim failures with error codes
 */
class UsernameClaimError extends Error {
  constructor(
    message: string,
    public code: string,
    public httpStatus?: number
  ) {
    super(message);
    this.name = 'UsernameClaimError';
  }
}

/**
 * Custom hook to handle username claiming with wallet signature.
 *
 * Flow:
 * 1. Validates wallet is connected
 * 2. Generates standard message: "I claim @{username} on TippinBit"
 * 3. Requests wallet signature via EIP-191
 * 4. POSTs to /.netlify/functions/username-claim
 * 5. Handles responses: 200 success, 409 conflict, 401 invalid signature
 *
 * @returns Object with claimUsername mutation function and state
 *
 * @example
 * ```typescript
 * function ClaimButton({ username }: { username: string }) {
 *   const { claimUsername, isPending, isSuccess, error } = useUsernameClaim();
 *
 *   const handleClaim = () => {
 *     claimUsername({ username });
 *   };
 *
 *   return (
 *     <div>
 *       <button onClick={handleClaim} disabled={isPending}>
 *         {isPending ? 'Claiming...' : 'Claim Username'}
 *       </button>
 *       {isSuccess && <span>✓ Username claimed!</span>}
 *       {error && <span>Error: {error.message}</span>}
 *     </div>
 *   );
 * }
 * ```
 */
export function useUsernameClaim() {
  const { address, isConnected } = useAccount();
  const { signMessageAsync } = useSignMessage();

  const mutation = useMutation({
    mutationFn: async ({ username }: { username: string }) => {
      // Validate wallet connection
      if (!isConnected || !address) {
        throw new UsernameClaimError(
          'Please connect your wallet to claim a username',
          'WALLET_NOT_CONNECTED'
        );
      }

      // Remove @ prefix if present for consistency
      const cleanUsername = username.replace(/^@/, '');

      // Generate standard message format
      const message = `I claim @${cleanUsername} on TippinBit`;

      // Request signature from wallet
      let signature: string;
      try {
        signature = await signMessageAsync({ message });
      } catch {
        // User rejected signature request
        throw new UsernameClaimError(
          'Signature request was rejected',
          'USER_REJECTED'
        );
      }

      // Prepare request payload
      const requestBody: UsernameClaimRequest = {
        username: cleanUsername,
        walletAddress: address,
        message,
        signature,
      };

      // POST to username claim API
      const response = await fetch('/.netlify/functions/username-claim', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      // Handle error responses
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({
          error: 'Unknown error',
          code: 'UNKNOWN_ERROR',
        }));

        // 409 Conflict: Race condition - username claimed between check and submission
        if (response.status === 409) {
          throw new UsernameClaimError(
            'Someone just claimed this username. Try another.',
            'USERNAME_TAKEN',
            409
          );
        }

        // 401 Unauthorized: Invalid signature
        if (response.status === 401) {
          throw new UsernameClaimError(
            'Signature verification failed. Please try again.',
            'INVALID_SIGNATURE',
            401
          );
        }

        // 400 Bad Request: Validation error
        if (response.status === 400) {
          throw new UsernameClaimError(
            errorData.error || 'Invalid username format',
            'VALIDATION_ERROR',
            400
          );
        }

        // Other errors
        throw new UsernameClaimError(
          errorData.error || 'Failed to claim username',
          errorData.code || 'NETWORK_ERROR',
          response.status
        );
      }

      // Parse success response
      const data: UsernameClaimResponse = await response.json();
      return data;
    },
  });

  return {
    claimUsername: mutation.mutate,
    claimUsernameAsync: mutation.mutateAsync,
    isPending: mutation.isPending,
    isSuccess: mutation.isSuccess,
    isError: mutation.isError,
    error: mutation.error as UsernameClaimError | null,
    data: mutation.data,
    reset: mutation.reset,
  };
}
