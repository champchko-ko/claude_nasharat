import { createHmac } from "node:crypto";
import { constantTimeCompare } from "./constantTimeCompare";

const DEFAULT_MAX_AGE_SECONDS = 30 * 24 * 60 * 60; // 30 days

/**
 * Validates an HMAC-signed bypass token and verifies it has not expired.
 */
export function verifyBypassToken(
  token: string | undefined,
  secret: string | undefined,
  maxAgeSeconds: number = DEFAULT_MAX_AGE_SECONDS,
  nowMs: number = Date.now(),
): boolean {
  if (!token || !secret) {
    return false;
  }

  const parts = token.split(".");
  if (parts.length !== 3) {
    return false;
  }

  const [randomHex, timestampStr, signature] = parts;
  const timestamp = Number.parseInt(timestampStr, 10);
  if (Number.isNaN(timestamp)) {
    return false;
  }

  const nowSeconds = Math.floor(nowMs / 1000);
  const ageSeconds = nowSeconds - timestamp;
  if (ageSeconds < 0 || ageSeconds > maxAgeSeconds) {
    return false;
  }

  const expectedSignature = createHmac("sha256", secret)
    .update(`${randomHex}.${timestampStr}`)
    .digest("hex");

  return constantTimeCompare(signature, expectedSignature);
}
