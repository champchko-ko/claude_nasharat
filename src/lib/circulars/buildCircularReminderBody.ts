export function buildCircularReminderBody(
  circularRef: string,
  circularTitle: string,
  customMessage?: string,
): string {
  const trimmed = customMessage?.trim();
  if (trimmed) return trimmed;

  if (circularRef) {
    return JSON.stringify({ ref: circularRef, title: circularTitle });
  }

  return JSON.stringify({});
}
