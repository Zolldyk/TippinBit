import type { Address, CachedUsernameResolution } from '@/types/domain';

/**
 * Cache TTL: 5 minutes
 */
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Store username resolution in session storage
 *
 * @param username - Username (with or without @ prefix)
 * @param address - Resolved wallet address
 */
export function setUsernameResolution(
  username: string,
  address: Address
): void {
  try {
    const key = `username-resolution:${username.toLowerCase().replace(/^@/, '')}`;
    const value: CachedUsernameResolution = {
      username: username.replace(/^@/, ''),
      address,
      timestamp: Date.now(),
    };
    sessionStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    // Browser may have disabled session storage, fail silently
    console.warn('Session storage unavailable:', e);
  }
}

/**
 * Retrieve username resolution from session storage
 *
 * Returns null if not found, expired, or session storage unavailable.
 *
 * @param username - Username (with or without @ prefix)
 * @returns Cached resolution or null
 */
export function getUsernameResolution(
  username: string
): CachedUsernameResolution | null {
  try {
    const key = `username-resolution:${username.toLowerCase().replace(/^@/, '')}`;
    const cached = sessionStorage.getItem(key);

    if (!cached) return null;

    const parsed: CachedUsernameResolution = JSON.parse(cached);

    // Check TTL
    const age = Date.now() - parsed.timestamp;
    if (age > CACHE_TTL) {
      sessionStorage.removeItem(key);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
}

/**
 * Clear username resolution from session storage
 *
 * @param username - Username (with or without @ prefix)
 */
export function clearUsernameResolution(username: string): void {
  try {
    const key = `username-resolution:${username.toLowerCase().replace(/^@/, '')}`;
    sessionStorage.removeItem(key);
  } catch {
    // Fail silently
  }
}
