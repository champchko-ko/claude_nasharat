import { buildCsvDocument } from "./buildCsvDocument";
import type { CircularReportRow } from "./types";

/** `name · n` so a partly compliant department carries its outstanding count. */
function formatDepartments(items: CircularReportRow["pendingDepartments"]): string {
  return items
    .map((item) => (item.outstanding > 0 ? `${item.name} (${item.outstanding})` : item.name))
    .join(" - ");
}

export function buildCircularsCsv(rows: CircularReportRow[]): string {
  const headers = [
    "الرقم المرجعي (Ref)",
    "العنوان (Title)",
    "التصنيف (Category)",
    "الأولوية (Priority)",
    "الحالة (Status)",
    "تاريخ النشر (Published At)",
    "تاريخ الاستحقاق (Due At)",
    "الأقسام المستهدفة (Targets)",
    "المستجيب (Compliant)",
    "متأخر (Overdue)",
    "لم يحن موعده (Not yet due)",
    "غير منطبق (Not applicable)",
    "نسبة الالتزام % (Compliance %)",
    "الأقسام المستجيبة (Responded Departments)",
    "الأقسام غير المستجيبة (Pending Departments)",
  ];

  const dataRows = rows.map((r) => [
    r.refNumber,
    r.title,
    r.category,
    r.priority,
    r.status,
    r.publishAt || "",
    r.dueAt || "",
    r.targeted,
    r.compliant,
    r.overdue,
    r.notYetDue,
    r.notApplicable,
    // Blank rather than 0 or 100: the circular required nothing, so it has no rate.
    r.percent === null ? "" : `${r.percent}%`,
    formatDepartments(r.respondedDepartments),
    formatDepartments(r.pendingDepartments),
  ]);

  return buildCsvDocument(headers, dataRows);
}
