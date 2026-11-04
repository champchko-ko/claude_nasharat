export type RateLimitBucket = { count: number; resetAt: number };

/**
 * The process-local windows used by `consumeRateLimitToken`.
 *
 * Shared through this module so the counter and its pruner read the same map
 * without either of them exporting a second runtime symbol.
 */
export const rateLimitBuckets = new Map<string, RateLimitBucket>();
