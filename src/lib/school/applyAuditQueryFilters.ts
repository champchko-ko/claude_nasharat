import type { AuditLogFilters } from "./getSchoolAuditLogs";

export interface FilterableAuditQuery {
  eq(column: string, value: unknown): this;
  ilike(column: string, pattern: string): this;
  gte(column: string, value: unknown): this;
  lte(column: string, value: unknown): this;
}

export function applyAuditQueryFilters<T extends FilterableAuditQuery>(
  query: T,
  schoolId?: string | null,
  filters?: AuditLogFilters,
): T {
  let q = query;
  void schoolId;
  if (!filters) {
    return q;
  }
  if (filters.action) {
    q = q.ilike("action", `%${filters.action}%`);
  }
  if (filters.entityType) {
    q = q.eq("entity_type", filters.entityType);
  }
  if (filters.actorLabel) {
    q = q.ilike("actor_label", `%${filters.actorLabel}%`);
  }
  if (filters.startDate) {
    q = q.gte("created_at", filters.startDate);
  }
  if (filters.endDate) {
    q = q.lte("created_at", filters.endDate);
  }
  return q;
}
