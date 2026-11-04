const SENSITIVE_KEYS = new Set([
  "password",
  "passwd",
  "pwd",
  "token",
  "secret",
  "apikey",
  "api_key",
  "authorization",
  "cookie",
  "set-cookie",
  "service_role",
  "service_key",
  "access_token",
  "refresh_token",
  "session",
  "jwt",
  "credential",
  "private_key",
  "email",
  "civil_id",
  "national_id",
  "phone",
  "phone_number",
  "iban",
  "bank_account",
]);

const MAX_DEPTH = 6;

export function redactSensitiveData(data: unknown): unknown {
  const seen = new WeakSet<object>();

  const redactValue = (value: unknown, depth: number): unknown => {
    if (depth > MAX_DEPTH) return "[TRUNCATED]";
    if (!value || typeof value !== "object") return value;

    if (seen.has(value)) return "[CIRCULAR]";
    seen.add(value);

    if (Array.isArray(value)) {
      return value.map((item) => redactValue(item, depth + 1));
    }

    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(value as Record<string, unknown>)) {
      result[key] = SENSITIVE_KEYS.has(key.toLowerCase())
        ? "[REDACTED]"
        : redactValue(val, depth + 1);
    }
    return result;
  };

  return redactValue(data, 0);
}
