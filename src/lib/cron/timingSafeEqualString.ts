import { timingSafeEqual } from "node:crypto";

/**
 * Compares two strings without leaking their contents through timing.
 *
 * Length is compared first because `timingSafeEqual` throws on buffers of
 * different size; the length of a header is not a secret.
 */
export function timingSafeEqualString(left: string, right: string): boolean {
  const leftBuffer = Buffer.from(left, "utf8");
  const rightBuffer = Buffer.from(right, "utf8");

  if (leftBuffer.length !== rightBuffer.length) return false;

  return timingSafeEqual(leftBuffer, rightBuffer);
}
