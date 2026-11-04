import { buildCsvDocument } from "./buildCsvDocument";
import type { MaintenanceReportRow } from "./types";

export function buildMaintenanceCsv(rows: MaintenanceReportRow[]): string {
  const headers = [
    "رقم البلاغ (Ticket #)",
    "العنوان (Title)",
    "التصنيف (Category)",
    "الأولوية (Priority)",
    "الحالة (Status)",
    "الموقع (Location)",
    "مقدم الطلب (Reporter)",
    "الفني المسند (Operator)",
    "تاريخ الإنشاء (Created At)",
    "تاريخ الإنجاز (Resolved At)",
    "وقت الإنجاز بالساعات (Resolution Hours)",
  ];

  const dataRows = rows.map((r) => [
    r.ticketNumber,
    r.title,
    r.category,
    r.priority,
    r.status,
    r.locationName,
    r.reporterName,
    r.operatorName || "",
    r.createdAt,
    r.resolvedAt || "",
    r.resolutionTimeHours ?? "",
  ]);

  return buildCsvDocument(headers, dataRows);
}
