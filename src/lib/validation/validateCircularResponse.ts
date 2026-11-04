export function validateCircularResponse(status: string, reason?: string | null): boolean {
  if (status !== "rejected") return true;
  return Boolean(reason && reason.trim().length > 0);
}
