import { constantTimeCompare } from "@/lib/security/constantTimeCompare";

/**
 * Validates operational bootstrap security guards for initial platform owner creation.
 * Returns an error code string if unauthorized, or null if eligible.
 */
export function validateBootstrapGuard(
  userEmail?: string | null,
  bootstrapSecret?: string,
): string | null {
  const expectedSecret = process.env.PLATFORM_BOOTSTRAP_SECRET;
  const allowedEmail = process.env.PLATFORM_OWNER_EMAIL;

  // In production, prevent open claiming unless explicitly configured
  if (process.env.NODE_ENV === "production" && !expectedSecret && !allowedEmail) {
    return "bootstrap-disabled-in-production";
  }

  if (
    expectedSecret &&
    (!bootstrapSecret || !constantTimeCompare(bootstrapSecret, expectedSecret))
  ) {
    return "invalid-bootstrap-secret";
  }

  if (
    allowedEmail &&
    (!userEmail || !constantTimeCompare(userEmail.toLowerCase(), allowedEmail.toLowerCase()))
  ) {
    return "unauthorized-bootstrap-identity";
  }

  return null;
}
