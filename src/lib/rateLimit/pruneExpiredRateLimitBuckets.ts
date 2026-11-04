import { rateLimitBuckets } from "./rateLimitBuckets";

/**
 * Drops expired windows so the in-memory map cannot grow without bound.
 *
 * Called only when the map is already large; scanning on every request would
 * cost more than the leak it prevents.
 */
export function pruneExpiredRateLimitBuckets(): void {
  const now = Date.now();

  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }
}
