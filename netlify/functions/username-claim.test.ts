import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HandlerEvent, HandlerContext } from '@netlify/functions';

// Mock Redis client - create mocks inside factory function
vi.mock('./utils/redis', () => {
  const mockRedisSet = vi.fn();
  const mockRedisSadd = vi.fn();
  const mockRedisIncr = vi.fn();
  const mockRedisExpire = vi.fn();
  const mockCheckRateLimit = vi.fn();

  return {
    redis: {
      set: mockRedisSet,
      sadd: mockRedisSadd,
      incr: mockRedisIncr,
      expire: mockRedisExpire,
    },
    checkRateLimit: mockCheckRateLimit,
  };
});

// Mock signature verification - create mocks inside factory function
vi.mock('./utils/verifySignature', () => {
  const mockVerifyWalletSignature = vi.fn();
  const mockStandardizeMessage = vi.fn((action: string) => `I ${action} on TippinBit`);

  return {
    verifyWalletSignature: mockVerifyWalletSignature,
    standardizeMessage: mockStandardizeMessage,
  };
});

// Import handler and mocked modules
import { handler } from './username-claim';
import { checkRateLimit } from './utils/redis';
import { verifyWalletSignature, standardizeMessage } from './utils/verifySignature';
import { redis } from './utils/redis';

describe('username-claim', () => {
  const validRequestBody = {
    username: 'alice',
    walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
    message: 'I claim @alice on TippinBit',
    signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
  };

  const mockEvent = (overrides?: Partial<HandlerEvent>): HandlerEvent => ({
    httpMethod: 'POST',
    body: JSON.stringify(validRequestBody),
    headers: {
      'x-forwarded-for': '192.168.1.1',
    },
    rawUrl: '/.netlify/functions/username-claim',
    rawQuery: '',
    path: '/.netlify/functions/username-claim',
    queryStringParameters: null,
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    ...overrides,
  });

  const mockContext: HandlerContext = {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'username-claim',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:username-claim',
    memoryLimitInMB: '1024',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/username-claim',
    logStreamName: '2025/10/19/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default: rate limit not exceeded
    vi.mocked(checkRateLimit).mockResolvedValue(true);
    // Default: signature valid
    vi.mocked(verifyWalletSignature).mockResolvedValue(true);
    // Default: username available (set returns 'OK')
    vi.mocked(redis.set).mockResolvedValue('OK');
    vi.mocked(redis.sadd).mockResolvedValue(1);
  });

  it('successfully claims available username', async () => {
    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toMatchObject({
      success: true,
      username: 'alice',
      walletAddress: validRequestBody.walletAddress,
    });

    // Verify Redis operations
    expect(vi.mocked(redis.set)).toHaveBeenCalledWith(
      'username:alice',
      expect.stringContaining(validRequestBody.walletAddress),
      { nx: true }
    );
    expect(vi.mocked(redis.sadd)).toHaveBeenCalledWith(
      `address:${validRequestBody.walletAddress}:usernames`,
      'alice'
    );
  });

  it('rejects username that is too short (< 3 characters)', async () => {
    const shortUsername = { ...validRequestBody, username: 'ab' };
    const response = await handler(
      mockEvent({ body: JSON.stringify(shortUsername) }),
      mockContext
    );

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details).toBeDefined();
    expect(body.details[0].message).toContain('at least 3 characters');
  });

  it('rejects username that is too long (> 20 characters)', async () => {
    const longUsername = { ...validRequestBody, username: 'a'.repeat(21) };
    const response = await handler(
      mockEvent({ body: JSON.stringify(longUsername) }),
      mockContext
    );

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details).toBeDefined();
    expect(body.details[0].message).toContain('at most 20 characters');
  });

  it('rejects username with invalid characters (special chars)', async () => {
    const invalidUsernames = [
      'alice!',
      'alice@bob',
      'alice bob',
      'alice#123',
      'alice$money',
    ];

    for (const username of invalidUsernames) {
      const invalidRequest = { ...validRequestBody, username };
      const response = await handler(
        mockEvent({ body: JSON.stringify(invalidRequest) }),
        mockContext
      );

      expect(response.statusCode).toBe(400);
      const body = JSON.parse(response.body);
      expect(body.code).toBe('VALIDATION_ERROR');
      expect(body.details[0].message).toContain('letters, numbers, underscores, and hyphens');
    }
  });

  it('rejects username with invalid signature', async () => {
    vi.mocked(verifyWalletSignature).mockResolvedValue(false);

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(401);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('INVALID_SIGNATURE');
    expect(body.error).toContain('Invalid signature');
  });

  it('returns 409 when username is already claimed', async () => {
    // Mock Redis set with nx: true returning null (key already exists)
    vi.mocked(redis.set).mockResolvedValue(null);

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(409);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('USERNAME_TAKEN');
    expect(body.error).toBe('This username is unavailable');
  });

  it('blocks excessive requests with rate limiting', async () => {
    vi.mocked(checkRateLimit).mockResolvedValue(false);

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(429);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('RATE_LIMIT_EXCEEDED');
    expect(body.error).toContain('Too many requests');
  });

  it('stores username in lowercase (case-insensitive)', async () => {
    const mixedCaseRequest = { ...validRequestBody, username: 'AlIcE' };
    const response = await handler(
      mockEvent({ body: JSON.stringify(mixedCaseRequest) }),
      mockContext
    );

    expect(response.statusCode).toBe(200);

    // Verify Redis key is lowercase
    expect(vi.mocked(redis.set)).toHaveBeenCalledWith(
      'username:alice', // lowercase
      expect.any(String),
      { nx: true }
    );

    const body = JSON.parse(response.body);
    expect(body.username).toBe('alice'); // Response returns lowercase
  });

  it('handles OPTIONS preflight request', async () => {
    const response = await handler(mockEvent({ httpMethod: 'OPTIONS' }), mockContext);

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Headers']).toBe('Content-Type');
  });

  it('rejects non-POST methods', async () => {
    const response = await handler(mockEvent({ httpMethod: 'GET' }), mockContext);

    expect(response.statusCode).toBe(405);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('rejects invalid Ethereum address format', async () => {
    const invalidAddress = { ...validRequestBody, walletAddress: '0xinvalid' };
    const response = await handler(
      mockEvent({ body: JSON.stringify(invalidAddress) }),
      mockContext
    );

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('VALIDATION_ERROR');
    expect(body.details[0].message).toContain('Invalid Ethereum address');
  });

  it('rejects invalid signature format', async () => {
    const invalidSignature = { ...validRequestBody, signature: '0xinvalid' };
    const response = await handler(
      mockEvent({ body: JSON.stringify(invalidSignature) }),
      mockContext
    );

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('includes CORS headers in all responses', async () => {
    const response = await handler(mockEvent(), mockContext);

    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Content-Type']).toBe('application/json');
  });

  it('handles missing request body gracefully', async () => {
    const response = await handler(mockEvent({ body: null }), mockContext);

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('VALIDATION_ERROR');
  });

  it('verifies correct message format with standardizeMessage', async () => {
    await handler(mockEvent(), mockContext);

    expect(vi.mocked(standardizeMessage)).toHaveBeenCalledWith('claim @alice');
    expect(vi.mocked(verifyWalletSignature)).toHaveBeenCalledWith(
      'I claim @alice on TippinBit',
      validRequestBody.signature,
      validRequestBody.walletAddress
    );
  });

  it('creates reverse index for address -> usernames mapping', async () => {
    await handler(mockEvent(), mockContext);

    expect(vi.mocked(redis.sadd)).toHaveBeenCalledWith(
      `address:${validRequestBody.walletAddress}:usernames`,
      'alice'
    );
  });

  it('handles Redis errors gracefully', async () => {
    vi.mocked(redis.set).mockRejectedValue(new Error('Redis connection failed'));

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.error).toBe('Internal server error');
  });
});
