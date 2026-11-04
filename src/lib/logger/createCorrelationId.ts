export function createCorrelationId(prefix = "err"): string {
  const randomPart = globalThis.crypto?.randomUUID
    ? globalThis.crypto.randomUUID().replace(/-/g, "").slice(0, 12)
    : Math.random().toString(36).substring(2, 14);

  return `${prefix}_${Date.now().toString(36)}${randomPart}`;
}
