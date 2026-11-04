import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { applyAuditQueryFilters } from "./applyAuditQueryFilters";

export type AuditLogRow = {
  id: string;
  actor_id: string | null;
  actor_label: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  metadata?: Record<string, unknown> | null;
  created_at: string;
};

export type AuditLogFilters = {
  action?: string;
  entityType?: string;
  actorLabel?: string;
  startDate?: string;
  endDate?: string;
  page?: number;
  pageSize?: number;
};

export type AuditLogResult = {
  logs: AuditLogRow[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

export async function getSchoolAuditLogs(
  schoolId?: string | null,
  filters?: AuditLogFilters,
): Promise<AuditLogResult> {
  const supabase = await createSupabaseServerClient();
  const page = Math.max(1, filters?.page ?? 1);
  const pageSize = Math.max(1, Math.min(100, filters?.pageSize ?? 50));
  const offset = (page - 1) * pageSize;

  let query = supabase
    .from("audit_logs")
    .select("id, actor_id, actor_label, action, entity_type, entity_id, metadata, created_at", {
      count: "exact",
    })
    .order("created_at", { ascending: false });

  query = applyAuditQueryFilters(query, schoolId, filters);
  query = query.range(offset, offset + pageSize - 1);

  const { data, count, error } = await query;
  if (error) {
    throw mapDatabaseError(error);
  }

  const totalCount = count ?? 0;
  const totalPages = Math.ceil(totalCount / pageSize);

  return {
    logs: (data as AuditLogRow[]) ?? [],
    totalCount,
    page,
    pageSize,
    totalPages,
  };
}
