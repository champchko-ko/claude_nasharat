import { buildCsvDocument } from "@/lib/reports/buildCsvDocument";
import type { AuditLogRow } from "@/lib/school/getSchoolAuditLogs";

export function buildAuditCsv(logs: AuditLogRow[]): string {
  const headers = ["Timestamp", "Action", "Entity Type", "Entity ID", "Actor", "Metadata"];

  const rows = logs.map((log) => [
    log.created_at,
    log.action,
    log.entity_type,
    log.entity_id ?? "",
    log.actor_label ?? log.actor_id ?? "System",
    log.metadata ? JSON.stringify(log.metadata) : "",
  ]);

  return buildCsvDocument(headers, rows);
}
