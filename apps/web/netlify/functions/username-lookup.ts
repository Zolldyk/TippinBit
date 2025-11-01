import type { Handler, HandlerEvent } from '@netlify/functions';
import { getUsernameRecord, redis } from './utils/redis';

// CORS and caching headers
const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Content-Type': 'application/json',
  'Cache-Control': 'public, max-age=300', // 5-minute cache
};

/**
 * Username Lookup Serverless Function
 *
 * GET /.netlify/functions/username-lookup?username=alice
 *
 * Retrieves wallet address for a claimed username.
 * Supports @ prefix in username (e.g., @alice or alice both work).
 *
 * Query parameters:
 * - username: string (required) - Username to lookup
 *
 * Responses:
 * - 200: Username found, returns {username, walletAddress, claimedAt}
 * - 400: Missing username parameter
 * - 404: Username not found
 * - 405: Method not allowed (only GET accepted)
 * - 500: Internal server error
 */
export const handler: Handler = async (
  event: HandlerEvent
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
  if (event.httpMethod !== 'GET') {
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
    // Extract username from query parameters
    let username = event.queryStringParameters?.username;

    if (!username) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({
          error: 'Username parameter required',
          code: 'MISSING_USERNAME',
        }),
      };
    }

    // Remove @ prefix if present and normalize to lowercase
    username = username.replace(/^@/, '').toLowerCase();

    // Fetch username record from Redis
    const record = await getUsernameRecord(username);

    if (!record) {
      return {
        statusCode: 404,
        headers,
        body: JSON.stringify({
          error: 'Username not found. Check spelling or use wallet address.',
          code: 'USERNAME_NOT_FOUND',
        }),
      };
    }

    // Fetch thank-you message if exists (stored as plain text)
    const messageKey = `username:${username}:message`;
    const thankyouMessage = await redis.get(messageKey);

    // Success response
    const response: Record<string, unknown> = {
      username,
      walletAddress: record.walletAddress,
      claimedAt: record.claimedAt,
    };

    if (thankyouMessage) {
      response.thankyouMessage = thankyouMessage as string;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify(response),
    };
  } catch (error) {
    console.error('Username lookup error:', error);

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
