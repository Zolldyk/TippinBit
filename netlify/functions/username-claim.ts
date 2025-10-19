import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { z } from 'zod';
import { verifyWalletSignature, standardizeMessage } from './utils/verifySignature';
import { redis, type UsernameRecord } from './utils/redis';
import { checkRateLimit } from './utils/redis';

// Zod schema for username claim request validation
const claimSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(20, 'Username must be at most 20 characters')
    .regex(
      /^[a-zA-Z0-9_-]+$/,
      'Username can only contain letters, numbers, underscores, and hyphens'
    ),
  walletAddress: z
    .string()
    .regex(/^0x[a-fA-F0-9]{40}$/, 'Invalid Ethereum address'),
  message: z.string(),
  signature: z.string().regex(/^0x[a-fA-F0-9]+$/, 'Invalid signature'),
});

// CORS headers for frontend requests
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
};

/**
 * Username Claim Serverless Function
 *
 * POST /.netlify/functions/username-claim
 *
 * Allows users to claim a unique @username linked to their wallet address.
 * Requires a valid EIP-191 signature to prevent impersonation.
 *
 * Request body:
 * {
 *   username: string,          // 3-20 chars, alphanumeric + underscore/hyphen
 *   walletAddress: string,     // Ethereum address (0x...)
 *   message: string,           // "I claim @{username} on TippinBit"
 *   signature: string          // EIP-191 signature
 * }
 *
 * Responses:
 * - 200: Username claimed successfully
 * - 400: Invalid request data (validation error)
 * - 401: Invalid signature
 * - 405: Method not allowed (only POST accepted)
 * - 409: Username already claimed
 * - 429: Too many requests (rate limit exceeded)
 * - 500: Internal server error
 */
export const handler: Handler = async (
  event: HandlerEvent,
  context: HandlerContext
) => {
  // Handle OPTIONS preflight requests
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 204,
      headers,
      body: '',
    };
  }

  // Validate HTTP method
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({
        error: 'Method not allowed',
        code: 'METHOD_NOT_ALLOWED',
      }),
    };
  }

  try {
    // Rate limiting: 20 requests per minute per IP
    const ip = event.headers['x-forwarded-for'] || 'unknown';
    const rateLimitIdentifier = `${ip}:username-claim`;
    const allowed = await checkRateLimit(rateLimitIdentifier, 20, 60);

    if (!allowed) {
      return {
        statusCode: 429,
        headers,
        body: JSON.stringify({
          error: 'Too many requests. Please try again later.',
          code: 'RATE_LIMIT_EXCEEDED',
        }),
      };
    }

    // Parse and validate request body
    const body = JSON.parse(event.body || '{}');
    const validated = claimSchema.parse(body);

    const { username, walletAddress, message, signature } = validated;

    // Verify signature
    const expectedMessage = standardizeMessage(`claim @${username}`);
    const isValid = await verifyWalletSignature(
      expectedMessage,
      signature as `0x${string}`,
      walletAddress as `0x${string}`
    );

    if (!isValid) {
      return {
        statusCode: 401,
        headers,
        body: JSON.stringify({
          error: 'Invalid signature. Please sign the message with your wallet.',
          code: 'INVALID_SIGNATURE',
        }),
      };
    }

    // Normalize username to lowercase for case-insensitive storage
    const normalizedUsername = username.toLowerCase();
    const key = `username:${normalizedUsername}`;

    // Create username record
    const record: UsernameRecord = {
      walletAddress: walletAddress as `0x${string}`,
      message,
      signature,
      claimedAt: new Date().toISOString(),
    };

    // Atomic username claim: set only if not exists (prevents race conditions)
    const success = await redis.set(key, JSON.stringify(record), {
      nx: true, // Only set if key doesn't exist
    });

    if (!success) {
      return {
        statusCode: 409,
        headers,
        body: JSON.stringify({
          error: 'This username is unavailable',
          code: 'USERNAME_TAKEN',
        }),
      };
    }

    // Create reverse index: address -> usernames
    await redis.sadd(`address:${walletAddress}:usernames`, normalizedUsername);

    // Success response
    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        username: normalizedUsername,
        walletAddress,
      }),
    };
  } catch (error) {
    console.error('Username claim error:', error);

    // Handle Zod validation errors
    if (error instanceof z.ZodError) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Invalid request data',
          code: 'VALIDATION_ERROR',
          details: error.errors,
        }),
      };
    }

    // Generic error response (don't expose internals)
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        error: 'Internal server error',
        code: 'INTERNAL_ERROR',
      }),
    };
  }
};
