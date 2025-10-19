/**
 * Integration Example: Using verifyWalletSignature in Netlify Functions
 *
 * This example demonstrates how to use the signature verification utility
 * in a serverless function to authenticate user requests.
 *
 * IMPORTANT: This is a documentation example only. Do not deploy this file.
 */

import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { verifyWalletSignature, standardizeMessage } from './verifySignature';

/**
 * Example: Username Claim Endpoint
 *
 * This endpoint allows users to claim a username by proving ownership
 * of their wallet address through signature verification.
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // 1. Parse request body
  const body = JSON.parse(event.body || '{}');
  const { username, walletAddress, signature } = body;

  // 2. Validate required fields
  if (!username || !walletAddress || !signature) {
    return {
      statusCode: 400,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Missing required fields',
        code: 'MISSING_FIELDS',
        required: ['username', 'walletAddress', 'signature'],
      }),
    };
  }

  // 3. Standardize the message format
  // The user should have signed this exact message in their wallet
  const message = standardizeMessage(`claim @${username}`);

  // 4. Verify the signature
  const isValid = await verifyWalletSignature(message, signature, walletAddress);

  if (!isValid) {
    // Signature verification failed - user doesn't own this wallet
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE',
        message: 'Could not verify wallet ownership',
      }),
    };
  }

  // 5. Signature is valid - proceed with authenticated request
  // In a real implementation, you would:
  // - Check if username is available
  // - Store username claim in database
  // - Return success response

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
      username,
      walletAddress,
      message: 'Username claimed successfully',
    }),
  };
};

/**
 * Example: Profile Update Endpoint
 *
 * This endpoint allows users to update their profile by proving ownership
 * of their wallet address.
 */
export const profileUpdateHandler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  const body = JSON.parse(event.body || '{}');
  const { walletAddress, signature, profileData } = body;

  // Standardize message for profile updates
  const message = standardizeMessage('update profile');

  // Verify wallet ownership
  const isValid = await verifyWalletSignature(message, signature, walletAddress);

  if (!isValid) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        error: 'Invalid signature',
        code: 'INVALID_SIGNATURE',
      }),
    };
  }

  // Proceed with profile update
  // (Database operations would go here)

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      success: true,
      message: 'Profile updated successfully',
      profileData,
    }),
  };
};

/**
 * Frontend Integration Example
 *
 * Here's how the frontend should generate signatures for these endpoints:
 *
 * ```typescript
 * // 1. Import dependencies (in your React component or hook)
 * import { useWalletClient } from 'wagmi';
 *
 * // 2. Create the message (must match backend standardizeMessage)
 * const username = 'alice';
 * const message = `I claim @${username} on TippinBit`;
 *
 * // 3. Sign the message with user's wallet
 * const walletClient = useWalletClient();
 * const signature = await walletClient.signMessage({ message });
 *
 * // 4. Send to API endpoint
 * const response = await fetch('/.netlify/functions/claim-username', {
 *   method: 'POST',
 *   headers: { 'Content-Type': 'application/json' },
 *   body: JSON.stringify({
 *     username,
 *     walletAddress: walletClient.account.address,
 *     signature,
 *   }),
 * });
 *
 * const result = await response.json();
 * if (result.success) {
 *   console.log('Username claimed!');
 * } else {
 *   console.error('Failed:', result.error);
 * }
 * ```
 */

/**
 * Security Best Practices:
 *
 * 1. Message Format Consistency
 *    - Always use standardizeMessage() to ensure consistent formatting
 *    - Frontend and backend must use identical message text
 *
 * 2. Action-Specific Messages
 *    - Each action should have a unique message (prevents signature reuse)
 *    - Example: "claim @alice" vs "update profile"
 *
 * 3. Address Validation
 *    - verifyWalletSignature handles address normalization automatically
 *    - Invalid addresses return false (no exceptions)
 *
 * 4. Error Handling
 *    - Always check signature validity before processing requests
 *    - Return 401 Unauthorized for invalid signatures
 *    - Log verification failures for security monitoring
 *
 * 5. Future Enhancements (not required for MVP)
 *    - Add timestamp to message to prevent replay attacks
 *    - Add nonce for time-bound signatures
 *    - Example: `I claim @alice on TippinBit at ${timestamp} with nonce ${nonce}`
 */
