/**
 * Sanitizes arbitrary log strings by redacting bearer tokens, JWTs, database
 * connection credentials, API keys, and email addresses to avoid PII / secret
 * leakage.
 */
export function sanitizeLogString(val: string): string {
  if (!val || typeof val !== "string") {
    return "";
  }

  return val
    .replace(/Bearer\s+[A-Za-z0-9\-._~+/=]+/gi, "Bearer [REDACTED]")
    .replace(/\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/g, "[REDACTED_JWT]")
    .replace(/\b(sbp|sk|pk|service_role)_[A-Za-z0-9_-]{8,}\b/gi, "[REDACTED_KEY]")
    .replace(
      /([?&](?:token|access_token|refresh_token|apikey|api_key|key|secret|password)=)[^&\s]+/gi,
      "$1[REDACTED]",
    )
    .replace(/(:\/\/[^:/@]+:)[^@]+(@)/g, "$1[REDACTED]$2")
    .replace(/[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+/g, "[REDACTED_EMAIL]");
}
