import { getServerEnv } from "@/lib/env/getServerEnv";
import { sanitizeNextPath } from "./sanitizeNextPath";

/**
 * Builds an auth-callback URL from the configured canonical origin.
 *
 * The previous implementation derived the origin from `x-forwarded-host` /
 * `host`, so a spoofed `Host` header could point a password-reset email at an
 * attacker's domain. `APP_URL` is deployment configuration and cannot be
 * influenced by a request.
 */
export function buildAuthRedirectUrl(nextPath: string): string {
  const appUrl = getServerEnv().APP_URL.replace(/\/+$/, "");
  return `${appUrl}/api/auth/callback?next=${sanitizeNextPath(nextPath)}`;
}
