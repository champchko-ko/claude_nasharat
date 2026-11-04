export function computeTicketResolutionHours(
  createdAt: string,
  resolvedAt: string | null | undefined,
): number | null {
  if (!resolvedAt) return null;
  const ms = new Date(resolvedAt).getTime() - new Date(createdAt).getTime();
  return Math.round((ms / (1000 * 60 * 60)) * 10) / 10;
}
