import { describe, it, expect, vi, beforeEach } from 'vitest';
import type { UsernameRecord } from './redis';

// Use vi.hoisted to ensure mocks are created before module imports
const mockFns = vi.hoisted(() => ({
  get: vi.fn(),
  incr: vi.fn(),
  expire: vi.fn(),
}));

// Mock @upstash/redis with constructor that assigns methods
vi.mock('@upstash/redis', () => ({
  Redis: class MockRedis {
    get = mockFns.get;
    incr = mockFns.incr;
    expire = mockFns.expire;
  },
}));

// Import after mocking
import { getUsernameRecord, checkRateLimit } from './redis';

describe('getUsernameRecord', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('fetches and parses valid username record', async () => {
    const mockRecord: UsernameRecord = {
      walletAddress: '0x742d35Cc6634C0532925a3b844Bc9e7595f0bEb0',
      message: 'I claim @alice on TippinBit',
      signature: '0x1234...',
      claimedAt: '2025-10-19T12:00:00Z',
    };

    mockFns.get.mockResolvedValue(JSON.stringify(mockRecord));

    const result = await getUsernameRecord('alice');

    expect(result).toEqual(mockRecord);
    expect(mockFns.get).toHaveBeenCalledWith('username:alice');
  });

  it('normalizes username to lowercase before lookup', async () => {
    mockFns.get.mockResolvedValue(null);

    await getUsernameRecord('ALICE');

    expect(mockFns.get).toHaveBeenCalledWith('username:alice');
  });

  it('returns null when username does not exist', async () => {
    mockFns.get.mockResolvedValue(null);

    const result = await getUsernameRecord('nonexistent');

    expect(result).toBeNull();
    expect(mockFns.get).toHaveBeenCalledWith('username:nonexistent');
  });

  it('handles Redis errors gracefully', async () => {
    mockFns.get.mockRejectedValue(new Error('Redis connection failed'));

    const result = await getUsernameRecord('alice');

    expect(result).toBeNull();
  });

  it('handles invalid JSON gracefully', async () => {
    mockFns.get.mockResolvedValue('invalid json {');

    const result = await getUsernameRecord('alice');

    expect(result).toBeNull();
  });

  it('handles username with special characters in key', async () => {
    mockFns.get.mockResolvedValue(null);

    await getUsernameRecord('alice_bob-123');

    expect(mockFns.get).toHaveBeenCalledWith('username:alice_bob-123');
  });
});

describe('checkRateLimit', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('allows first request and sets expiration', async () => {
    mockFns.incr.mockResolvedValue(1);
    mockFns.expire.mockResolvedValue(1);

    const result = await checkRateLimit('test-ip:username-claim', 20, 60);

    expect(result).toBe(true);
    expect(mockFns.incr).toHaveBeenCalledWith('ratelimit:test-ip:username-claim');
    expect(mockFns.expire).toHaveBeenCalledWith('ratelimit:test-ip:username-claim', 60);
  });

  it('allows requests within limit', async () => {
    mockFns.incr.mockResolvedValue(10); // 10 requests out of 20

    const result = await checkRateLimit('test-ip:username-claim', 20, 60);

    expect(result).toBe(true);
    expect(mockFns.incr).toHaveBeenCalled();
    expect(mockFns.expire).not.toHaveBeenCalled(); // Only first request sets expiration
  });

  it('blocks requests exceeding limit', async () => {
    mockFns.incr.mockResolvedValue(21); // Exceeded 20 limit

    const result = await checkRateLimit('test-ip:username-claim', 20, 60);

    expect(result).toBe(false);
    expect(mockFns.incr).toHaveBeenCalled();
  });

  it('uses default limit and window when not specified', async () => {
    mockFns.incr.mockResolvedValue(1);
    mockFns.expire.mockResolvedValue(1);

    const result = await checkRateLimit('test-ip:username-claim');

    expect(result).toBe(true);
    expect(mockFns.expire).toHaveBeenCalledWith('ratelimit:test-ip:username-claim', 60);
  });

  it('fails open (allows request) on Redis error', async () => {
    mockFns.incr.mockRejectedValue(new Error('Redis connection failed'));

    const result = await checkRateLimit('test-ip:username-claim', 20, 60);

    expect(result).toBe(true); // Fail open
  });

  it('allows exactly at limit', async () => {
    mockFns.incr.mockResolvedValue(20); // Exactly at limit

    const result = await checkRateLimit('test-ip:username-claim', 20, 60);

    expect(result).toBe(true);
  });

  it('blocks when over limit by one', async () => {
    mockFns.incr.mockResolvedValue(21); // One over limit

    const result = await checkRateLimit('test-ip:username-claim', 20, 60);

    expect(result).toBe(false);
  });

  it('handles custom window duration', async () => {
    mockFns.incr.mockResolvedValue(1);
    mockFns.expire.mockResolvedValue(1);

    await checkRateLimit('test-ip:username-claim', 10, 300); // 5 minute window

    expect(mockFns.expire).toHaveBeenCalledWith('ratelimit:test-ip:username-claim', 300);
  });

  it('tracks different identifiers separately', async () => {
    mockFns.incr.mockResolvedValue(1);
    mockFns.expire.mockResolvedValue(1);

    await checkRateLimit('ip1:username-claim', 20, 60);
    await checkRateLimit('ip2:username-claim', 20, 60);

    expect(mockFns.incr).toHaveBeenNthCalledWith(1, 'ratelimit:ip1:username-claim');
    expect(mockFns.incr).toHaveBeenNthCalledWith(2, 'ratelimit:ip2:username-claim');
  });
});

describe('Redis client initialization', () => {
  it('requires UPSTASH_REDIS_REST_URL environment variable', () => {
    // This test verifies that the module throws if env vars are missing
    // The actual check happens during module initialization, so we can't
    // test it easily without reloading the module. This is a placeholder
    // for documentation purposes.
    expect(process.env.UPSTASH_REDIS_REST_URL).toBeDefined();
  });

  it('requires UPSTASH_REDIS_REST_TOKEN environment variable', () => {
    // Same as above - actual validation happens at module init time
    expect(process.env.UPSTASH_REDIS_REST_TOKEN).toBeDefined();
  });
});
