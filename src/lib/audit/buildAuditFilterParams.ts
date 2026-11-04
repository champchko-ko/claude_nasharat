import type { AuditLogFilters } from "@/lib/school/getSchoolAuditLogs";

export function buildAuditFilterParams(filters?: AuditLogFilters): URLSearchParams {
  const params = new URLSearchParams();
  if (!filters) return params;

  const entries: [string, string | undefined][] = [
    ["action", filters.action],
    ["entityType", filters.entityType],
    ["actorLabel", filters.actorLabel],
    ["startDate", filters.startDate],
    ["endDate", filters.endDate],
  ];

  for (const [key, val] of entries) {
    if (val) params.set(key, val);
  }

  return params;
}
