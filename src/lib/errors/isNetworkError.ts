import { matchesNetworkMessage } from "./matchesNetworkMessage";

const NETWORK_CODES = new Set([
  "ENOTFOUND",
  "EAI_AGAIN",
  "ECONNREFUSED",
  "ECONNRESET",
  "EPIPE",
  "EHOSTUNREACH",
  "ENETUNREACH",
  "UND_ERR_SOCKET",
]);

export function isNetworkError(error: unknown): boolean {
  if (typeof error !== "object" || !error) return false;

  const candidate = error as {
    code?: unknown;
    name?: unknown;
    message?: unknown;
    status?: unknown;
  };

  if (typeof candidate.code === "string" && NETWORK_CODES.has(candidate.code)) {
    return true;
  }

  const name = typeof candidate.name === "string" ? candidate.name : "";
  if (matchesNetworkMessage(name, candidate.message)) {
    return true;
  }

  return candidate.status === 0;
}
