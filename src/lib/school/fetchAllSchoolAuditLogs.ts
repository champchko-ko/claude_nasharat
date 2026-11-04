import { createSupabaseServerClient } from "@/lib/supabase";
import { mapDatabaseError } from "@/lib/errors/mapDatabaseError";
import { applyAuditQueryFilters } from "./applyAuditQueryFilters";
import type { AuditLogFilters, AuditLogRow } from "./getSchoolAuditLogs";

export async function fetchAllSchoolAuditLogs(
  schoolId?: string | null,
  filters?: Omit<AuditLogFilters, "page" | "pageSize">,
  batchSize = 1000,
): Promise<AuditLogRow[]> {
  const supabase = await createSupabaseServerClient();
  const allLogs: AuditLogRow[] = [];
  let from = 0;
  let hasMore = true;

  while (hasMore) {
    let query = supabase
      .from("audit_logs")
      .select("id, actor_id, actor_label, action, entity_type, entity_id, metadata, created_at")
      .order("created_at", { ascending: false });

    query = applyAuditQueryFilters(query, schoolId, filters);
    query = query.range(from, from + batchSize - 1);

    const { data, error } = await query;
    if (error) {
      throw mapDatabaseError(error);
    }

    const batch = (data as AuditLogRow[]) ?? [];
    allLogs.push(...batch);

    if (batch.length < batchSize) {
      hasMore = false;
    } else {
      from += batchSize;
    }
  }

  return allLogs;
}
