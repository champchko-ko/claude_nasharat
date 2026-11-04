import { rateLimitBuckets } from "./rateLimitBuckets";
import { pruneExpiredRateLimitBuckets } from "./pruneExpiredRateLimitBuckets";

const MAX_TRACKED_KEYS = 5_000;

/**
 * A fixed-window counter, kept in process memory.
 *
 * This is a spam guard, not a security control: serverless instances each keep
 * their own window, so it cannot bound global traffic. It is enough to stop one
 * broken client from flooding the error log, which is the realistic failure.
 */
export function consumeRateLimitToken(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();

  if (rateLimitBuckets.size > MAX_TRACKED_KEYS) {
    pruneExpiredRateLimitBuckets();
  }

  const bucket = rateLimitBuckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    rateLimitBuckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= limit) return false;

  bucket.count += 1;
  return true;
}
