export function extractMessageText(message: unknown): string {
  if (typeof message === "string") return message;
  if (message && typeof message === "object" && "message" in message) {
    return String((message as { message: unknown }).message);
  }
  return String(message ?? "");
}
