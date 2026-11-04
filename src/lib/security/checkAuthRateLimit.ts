import { consumeRateLimitToken } from "@/lib/rateLimit/consumeRateLimitToken";

type RateRule = {
  ipLimit: number;
  ipWindowMs: number;
  idLimit: number;
  idWindowMs: number;
};

const RULES: Record<string, RateRule> = {
  login: { ipLimit: 10, ipWindowMs: 60_000, idLimit: 5, idWindowMs: 300_000 },
  password_reset: { ipLimit: 5, ipWindowMs: 300_000, idLimit: 3, idWindowMs: 300_000 },
  owner_claim: { ipLimit: 5, ipWindowMs: 300_000, idLimit: 5, idWindowMs: 300_000 },
};

export type AuthRateLimitOptions = {
  action: "login" | "password_reset" | "owner_claim";
  ip: string;
  identifier?: string;
};

/**
 * Enforces dual-key application-level rate limits (client IP and target account)
 * for sensitive authentication and platform bootstrap operations.
 */
export function checkAuthRateLimit(options: AuthRateLimitOptions): boolean {
  const rule = RULES[options.action];
  if (!rule) {
    return true;
  }

  const ipAllowed = consumeRateLimitToken(
    `auth:${options.action}:ip:${options.ip}`,
    rule.ipLimit,
    rule.ipWindowMs,
  );
  if (!ipAllowed) {
    return false;
  }

  if (options.identifier) {
    const idKey = options.identifier.trim().toLowerCase();
    const idAllowed = consumeRateLimitToken(
      `auth:${options.action}:id:${idKey}`,
      rule.idLimit,
      rule.idWindowMs,
    );
    if (!idAllowed) {
      return false;
    }
  }

  return true;
}
