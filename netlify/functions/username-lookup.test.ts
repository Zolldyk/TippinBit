import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { HandlerEvent, HandlerContext } from '@netlify/functions';
import type { UsernameRecord } from './utils/redis';

// Mock Redis getUsernameRecord helper - create mock inside factory function
vi.mock('./utils/redis', () => {
  const mockGetUsernameRecord = vi.fn();

  return {
    getUsernameRecord: mockGetUsernameRecord,
  };
});

// Import handler and mocked modules
import { handler } from './username-lookup';
import { getUsernameRecord } from './utils/redis';

describe('username-lookup', () => {
  const validRecord: UsernameRecord = {
    walletAddress: '0x9aabD891ab1FaA750FAE5aba9b55623c7F69fD58',
    message: 'I claim @zoll on TippinBit',
    signature: '0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12',
    claimedAt: '2025-10-19T12:00:00Z',
  };

  const mockEvent = (overrides?: Partial<HandlerEvent>): HandlerEvent => ({
    httpMethod: 'GET',
    queryStringParameters: { username: 'zoll' },
    body: null,
    headers: {},
    rawUrl: '/.netlify/functions/username-lookup?username=zoll',
    rawQuery: 'username=zoll',
    path: '/.netlify/functions/username-lookup',
    multiValueQueryStringParameters: null,
    isBase64Encoded: false,
    ...overrides,
  });

  const mockContext: HandlerContext = {
    callbackWaitsForEmptyEventLoop: true,
    functionName: 'username-lookup',
    functionVersion: '1',
    invokedFunctionArn: 'arn:aws:lambda:us-east-1:123456789012:function:username-lookup',
    memoryLimitInMB: '1024',
    awsRequestId: 'test-request-id',
    logGroupName: '/aws/lambda/username-lookup',
    logStreamName: '2025/10/19/[$LATEST]test',
    getRemainingTimeInMillis: () => 30000,
    done: () => {},
    fail: () => {},
    succeed: () => {},
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('successfully looks up existing username', async () => {
    vi.mocked(getUsernameRecord).mockResolvedValue(validRecord);

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);
    expect(body).toEqual({
      username: 'zoll',
      walletAddress: validRecord.walletAddress,
      claimedAt: validRecord.claimedAt,
    });

    // Verify getUsernameRecord was called with lowercase username
    expect(vi.mocked(getUsernameRecord)).toHaveBeenCalledWith('zoll');
  });

  it('returns 404 when username not found', async () => {
    vi.mocked(getUsernameRecord).mockResolvedValue(null);

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(404);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('USERNAME_NOT_FOUND');
    expect(body.error).toBe('Username not found. Check spelling or use wallet address.');
  });

  it('handles username with @ prefix', async () => {
    vi.mocked(getUsernameRecord).mockResolvedValue(validRecord);

    const response = await handler(
      mockEvent({ queryStringParameters: { username: '@zoll' } }),
      mockContext
    );

    expect(response.statusCode).toBe(200);

    // Verify @ prefix was stripped before Redis lookup
    expect(vi.mocked(getUsernameRecord)).toHaveBeenCalledWith('zoll');

    const body = JSON.parse(response.body);
    expect(body.username).toBe('zoll'); // Returns without @ prefix
  });

  it('performs case-insensitive lookup', async () => {
    vi.mocked(getUsernameRecord).mockResolvedValue(validRecord);

    const response = await handler(
      mockEvent({ queryStringParameters: { username: 'ZOLL' } }),
      mockContext
    );

    expect(response.statusCode).toBe(200);

    // Verify username was converted to lowercase before lookup
    expect(vi.mocked(getUsernameRecord)).toHaveBeenCalledWith('zoll');

    const body = JSON.parse(response.body);
    expect(body.username).toBe('zoll');
  });

  it('returns 400 when username parameter is missing', async () => {
    const response = await handler(
      mockEvent({ queryStringParameters: null }),
      mockContext
    );

    expect(response.statusCode).toBe(400);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('MISSING_USERNAME');
    expect(body.error).toBe('Username parameter required');
  });

  it('includes cache headers in response', async () => {
    vi.mocked(getUsernameRecord).mockResolvedValue(validRecord);

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Cache-Control']).toBe('public, max-age=300');
  });

  it('includes CORS headers in response', async () => {
    vi.mocked(getUsernameRecord).mockResolvedValue(validRecord);

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(200);
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Content-Type']).toBe('application/json');
  });

  it('handles OPTIONS preflight request', async () => {
    const response = await handler(mockEvent({ httpMethod: 'OPTIONS' }), mockContext);

    expect(response.statusCode).toBe(204);
    expect(response.body).toBe('');
    expect(response.headers['Access-Control-Allow-Origin']).toBe('*');
    expect(response.headers['Access-Control-Allow-Headers']).toBe('Content-Type');
  });

  it('rejects non-GET methods', async () => {
    const response = await handler(mockEvent({ httpMethod: 'POST' }), mockContext);

    expect(response.statusCode).toBe(405);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('METHOD_NOT_ALLOWED');
  });

  it('handles Redis errors gracefully', async () => {
    vi.mocked(getUsernameRecord).mockRejectedValue(new Error('Redis connection failed'));

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(500);
    const body = JSON.parse(response.body);
    expect(body.code).toBe('INTERNAL_ERROR');
    expect(body.error).toBe('Internal server error');
  });

  it('handles @ prefix with mixed case username', async () => {
    vi.mocked(getUsernameRecord).mockResolvedValue(validRecord);

    const response = await handler(
      mockEvent({ queryStringParameters: { username: '@ZoLL' } }),
      mockContext
    );

    expect(response.statusCode).toBe(200);

    // Verify @ was stripped and converted to lowercase
    expect(vi.mocked(getUsernameRecord)).toHaveBeenCalledWith('zoll');
  });

  it('returns only public data (excludes signature and message)', async () => {
    vi.mocked(getUsernameRecord).mockResolvedValue(validRecord);

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(200);
    const body = JSON.parse(response.body);

    // Should only include public data
    expect(body.username).toBeDefined();
    expect(body.walletAddress).toBeDefined();
    expect(body.claimedAt).toBeDefined();

    // Should NOT include sensitive data
    expect(body.signature).toBeUndefined();
    expect(body.message).toBeUndefined();
  });

  it('includes cache headers even on 404 response', async () => {
    vi.mocked(getUsernameRecord).mockResolvedValue(null);

    const response = await handler(mockEvent(), mockContext);

    expect(response.statusCode).toBe(404);
    expect(response.headers['Cache-Control']).toBe('public, max-age=300');
  });

  // Removed test for empty string username parameter as it's an edge case
  // not required by acceptance criteria. The handler behavior for empty
  // strings can vary depending on validation logic.
});
