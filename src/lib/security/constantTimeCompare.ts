import { createHash, timingSafeEqual } from "node:crypto";

/**
 * Compares two strings in constant time using SHA-256 digests.
 *
 * Hashing both values before calling `timingSafeEqual` guarantees equal buffer
 * lengths (32 bytes), avoiding early returns that leak length information.
 */
export function constantTimeCompare(left: string, right: string): boolean {
  const leftHash = createHash("sha256").update(left).digest();
  const rightHash = createHash("sha256").update(right).digest();
  return timingSafeEqual(leftHash, rightHash);
}
