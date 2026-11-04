export function isNextRouterError(error: unknown): boolean {
  if (typeof error !== "object" || error === null) {
    return false;
  }

  const digest = (error as { digest?: unknown }).digest;
  if (typeof digest !== "string") {
    return false;
  }

  return digest.startsWith("NEXT_REDIRECT") || digest.startsWith("NEXT_NOT_FOUND");
}
