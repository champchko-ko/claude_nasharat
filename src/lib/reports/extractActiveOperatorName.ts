export function extractActiveOperatorName(
  assignments?: Array<{ is_active: boolean; operator?: { full_name: string } | null }> | null,
): string | null {
  if (!Array.isArray(assignments)) return null;
  const active = assignments.find((a) => a.is_active);
  return active?.operator?.full_name ?? null;
}
