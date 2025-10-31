import { verifyMessage, isAddress, getAddress } from 'viem';

// Type definitions
type Address = `0x${string}`;
type Signature = `0x${string}`;

/**
 * Verifies a wallet signature to authenticate a user action
 *
 * This function validates that a given signature was created by the expected wallet address
 * for a specific message. It uses EIP-191 personal_sign format (standard for MetaMask, WalletConnect, etc.).
 *
 * @param message - The exact message that was signed (must match what user signed in their wallet)
 * @param signature - The EIP-191 signature from user's wallet (0x-prefixed hex string)
 * @param expectedAddress - The Ethereum address expected to have signed the message
 * @returns Promise resolving to true if signature is valid and from expectedAddress, false otherwise
 *
 * @example
 * ```typescript
 * const message = standardizeMessage('claim @alice');
 * const isValid = await verifyWalletSignature(message, signature, walletAddress);
 *
 * if (!isValid) {
 *   return { statusCode: 401, body: JSON.stringify({ error: 'Invalid signature' }) };
 * }
 * ```
 *
 * @remarks
 * - This function never throws exceptions; it returns false for any validation errors
 * - Addresses are normalized to checksum format (EIP-55) for consistent comparison
 * - Invalid address formats, malformed signatures, or verification failures all return false
 * - Supports EIP-191 personal_sign format (Viem's default)
 */
export async function verifyWalletSignature(
  message: string,
  signature: Signature,
  expectedAddress: Address
): Promise<boolean> {
  try {
    // Validate address format
    if (!isAddress(expectedAddress)) {
      console.error('Invalid address format:', expectedAddress);
      return false;
    }

    // Normalize to checksum format (EIP-55) for consistent comparison
    const normalizedAddress = getAddress(expectedAddress);

    // Verify signature using Viem's verifyMessage (EIP-191 format)
    const isValid = await verifyMessage({
      address: normalizedAddress,
      message,
      signature,
    });

    return isValid;
  } catch (error) {
    // Any errors (invalid signature format, verification failure, etc.) return false
    console.error('Signature verification error:', error);
    return false;
  }
}

/**
 * Standardizes an action into TippinBit's message format
 *
 * All authentication messages in TippinBit follow the pattern: "I {action} on TippinBit"
 * This ensures consistency and prevents signature reuse across different actions.
 *
 * @param action - The action being authenticated (e.g., "claim @alice", "update profile")
 * @returns Standardized message in the format "I {action} on TippinBit"
 *
 * @example
 * ```typescript
 * standardizeMessage("claim @alice")       // Returns "I claim @alice on TippinBit"
 * standardizeMessage("update profile")     // Returns "I update profile on TippinBit"
 * standardizeMessage("change settings")    // Returns "I change settings on TippinBit"
 * ```
 */
export function standardizeMessage(action: string): string {
  return `I ${action} on TippinBit`;
}
