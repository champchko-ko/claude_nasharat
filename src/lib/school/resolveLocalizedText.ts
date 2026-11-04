export function resolveLocalizedText(
  locale: string,
  arText?: string | null,
  enText?: string | null,
  fallback?: string | null,
): string | null {
  if (locale === "ar") {
    if (arText) return arText;
    if (fallback) return fallback;
    return enText ?? null;
  }
  if (enText) return enText;
  if (fallback) return fallback;
  return arText ?? null;
}
