import { Redis } from '@upstash/redis';

// Type definitions
type Address = `0x${string}`;

/**
 * UsernameRecord stored in Redis for each claimed username
 */
export interface UsernameRecord {
  walletAddress: Address;
  message: string;
  signature: string;
  claimedAt: string; // ISO 8601 timestamp
}

// Validate required environment variables
if (!process.env['UPSTASH_REDIS_REST_URL']) {
  throw new Error('UPSTASH_REDIS_REST_URL is not defined');
}

if (!process.env['UPSTASH_REDIS_REST_TOKEN']) {
  throw new Error('UPSTASH_REDIS_REST_TOKEN is not defined');
}

/**
 * Redis client configured for Upstash REST API
 *
 * Configuration:
 * - automaticDeserialization: false for manual JSON parsing control
 * - HTTP-based REST API (serverless-friendly, no connection pooling needed)
 */
export const redis = new Redis({
  url: process.env['UPSTASH_REDIS_REST_URL'],
  token: process.env['UPSTASH_REDIS_REST_TOKEN'],
  automaticDeserialization: false, // Manual JSON parsing for control
});

/**
 * Fetches a username record from Redis
 *
 * @param username - Username to lookup (will be normalized to lowercase)
 * @returns UsernameRecord if found, null otherwise
 *
 * @example
 * ```typescript
 * const record = await getUsernameRecord('alice');
 * if (record) {
 *   console.log(record.walletAddress); // "0x742d..."
 * }
 * ```
 */
export async function getUsernameRecord(
  username: string
): Promise<UsernameRecord | null> {
  try {
    const key = `username:${username.toLowerCase()}`;
    const record = await redis.get(key);

    if (!record) {
      return null;
    }

    // Manual JSON parsing (automaticDeserialization is false)
    return JSON.parse(record as string);
  } catch (error) {
    console.error('Error fetching username record:', error);
    return null;
  }
}

/**
 * Rate limiting helper using Redis INCR
 *
 * Uses Redis atomic operations to track request counts per identifier.
 * First request in a window sets the expiration, subsequent requests increment the counter.
 *
 * @param identifier - Unique identifier for rate limiting (e.g., IP address)
 * @param limit - Maximum requests allowed in the window (default: 20)
 * @param window - Time window in seconds (default: 60)
 * @returns true if request is allowed, false if rate limit exceeded
 *
 * @example
 * ```typescript
 * const ip = event.headers['x-forwarded-for'];
 * const allowed = await checkRateLimit(`ratelimit:${ip}:username-claim`, 20, 60);
 *
 * if (!allowed) {
 *   return { statusCode: 429, body: 'Too many requests' };
 * }
 * ```
 */
export async function checkRateLimit(
  identifier: string,
  limit: number = 20,
  window: number = 60
): Promise<boolean> {
  try {
    const key = `ratelimit:${identifier}`;
    const count = await redis.incr(key);

    // Set expiration on first request
    if (count === 1) {
      await redis.expire(key, window);
    }

    return count <= limit;
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Fail open (allow request) if Redis is down
    return true;
  }
}
