type ErrorCodeLike = {
  code?: unknown;
  name?: unknown;
  message?: unknown;
};

const TIMEOUT_CODES = new Set(["ETIMEDOUT", "ESOCKETTIMEDOUT", "UND_ERR_CONNECT_TIMEOUT"]);
const TIMEOUT_NAMES = new Set(["TimeoutError", "AbortError"]);

export function isTimeoutError(error: unknown): boolean {
  if (typeof error !== "object" || !error) return false;

  const candidate = error as ErrorCodeLike;
  const code = typeof candidate.code === "string" ? candidate.code : "";
  const name = typeof candidate.name === "string" ? candidate.name : "";

  if (TIMEOUT_NAMES.has(name) || TIMEOUT_CODES.has(code)) {
    return true;
  }

  const message = typeof candidate.message === "string" ? candidate.message.toLowerCase() : "";
  return message.includes("request timed out") || message.includes("gateway timeout");
}
