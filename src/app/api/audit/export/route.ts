import { withApiErrorHandler, ForbiddenError } from "@/lib/errors";
import { assertCanViewAudit } from "@/lib/audit/assertCanViewAudit";
import { fetchAllSchoolAuditLogs } from "@/lib/school/fetchAllSchoolAuditLogs";
import { buildAuditCsv } from "@/lib/audit/buildAuditCsv";

async function handleAuditExport(request: Request) {
  const authCheck = await assertCanViewAudit();
  if (!authCheck.authorized) {
    throw new ForbiddenError(authCheck.error || "Unauthorized");
  }

  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action") || undefined;
  const entityType = searchParams.get("entityType") || undefined;
  const actorLabel = searchParams.get("actorLabel") || undefined;
  const startDate = searchParams.get("startDate") || undefined;
  const endDate = searchParams.get("endDate") || undefined;

  const logs = await fetchAllSchoolAuditLogs(authCheck.schoolId, {
    action,
    entityType,
    actorLabel,
    startDate,
    endDate,
  });

  const csvContent = buildAuditCsv(logs);
  const filename = `audit-logs-${Date.now()}.csv`;

  return new Response(csvContent, {
    status: 200,
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": "no-store, no-cache, must-revalidate, private",
      Pragma: "no-cache",
      Expires: "0",
    },
  });
}

export const GET = withApiErrorHandler(handleAuditExport);
