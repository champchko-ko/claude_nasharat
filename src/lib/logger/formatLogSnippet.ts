import { sanitizeLogString } from "./sanitizeLogString";

export function formatLogSnippet(text: string | undefined, maxLength: number): string | undefined {
  if (!text) return undefined;
  return sanitizeLogString(text).slice(0, maxLength);
}
