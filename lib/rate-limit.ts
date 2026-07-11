/**
 * Rate limiting middleware using an in-memory sliding window.
 * Suitable for single-instance deployments; see SECURITY.md
 * for production alternatives (e.g., Upstash Redis).
 *
 * @module lib/rate-limit
 */

/** Rate limit configuration */
interface RateLimitConfig {
  /** Maximum number of requests allowed in the window */
  maxRequests: number;
  /** Time window in milliseconds */
  windowMs: number;
}

/** Tracks request timestamps per IP */
const ipRequestMap = new Map<string, number[]>();

/** Default rate limit: 20 requests per minute */
const DEFAULT_CONFIG: RateLimitConfig = {
  maxRequests: 20,
  windowMs: 60_000,
};

/**
 * Cleans up expired entries from the rate limit map.
 * Runs periodically to prevent memory leaks.
 */
function cleanup(): void {
  const now = Date.now();
  for (const [ip, timestamps] of ipRequestMap) {
    const valid = timestamps.filter((t) => now - t < DEFAULT_CONFIG.windowMs);
    if (valid.length === 0) {
      ipRequestMap.delete(ip);
    } else {
      ipRequestMap.set(ip, valid);
    }
  }
}

// Run cleanup every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(cleanup, 5 * 60_000);
}

/**
 * Checks if a request from the given IP should be rate-limited.
 *
 * @param ip - The client's IP address
 * @param config - Optional custom rate limit configuration
 * @returns Object with allowed status and remaining requests
 */
export function checkRateLimit(
  ip: string,
  config: RateLimitConfig = DEFAULT_CONFIG
): { allowed: boolean; remaining: number; resetMs: number } {
  const now = Date.now();
  const timestamps = ipRequestMap.get(ip) ?? [];

  // Filter to only timestamps within the current window
  const validTimestamps = timestamps.filter((t) => now - t < config.windowMs);

  if (validTimestamps.length >= config.maxRequests) {
    const oldestInWindow = validTimestamps[0] ?? now;
    const resetMs = config.windowMs - (now - oldestInWindow);
    return {
      allowed: false,
      remaining: 0,
      resetMs,
    };
  }

  // Record this request
  validTimestamps.push(now);
  ipRequestMap.set(ip, validTimestamps);

  return {
    allowed: true,
    remaining: config.maxRequests - validTimestamps.length,
    resetMs: config.windowMs,
  };
}

/**
 * Resets the rate limit map. Used in testing.
 */
export function resetRateLimits(): void {
  ipRequestMap.clear();
}
