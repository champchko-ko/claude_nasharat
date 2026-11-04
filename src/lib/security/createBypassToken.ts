import { createHmac, randomBytes } from "node:crypto";

/**
 * Generates an HMAC-signed token for bypassing the under-construction landing page.
 * Format: `<randomHex>.<timestampSeconds>.<hmacSignature>`
 */
export function createBypassToken(secret: string, nowMs: number = Date.now()): string {
  const randomHex = randomBytes(16).toString("hex");
  const timestamp = Math.floor(nowMs / 1000);
  const payload = `${randomHex}.${timestamp}`;
  const signature = createHmac("sha256", secret).update(payload).digest("hex");
  return `${payload}.${signature}`;
}
