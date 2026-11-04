const NETWORK_KEYWORDS = ["fetch failed", "network request failed"] as const;

export function matchesNetworkMessage(name: string, message: unknown): boolean {
  if (name !== "TypeError" || typeof message !== "string") {
    return false;
  }
  const lower = message.toLowerCase();
  return NETWORK_KEYWORDS.some((kw) => lower.includes(kw));
}
