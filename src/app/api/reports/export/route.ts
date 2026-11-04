import { withApiErrorHandler, ForbiddenError } from "@/lib/errors";
import { assertCanViewReports } from "@/lib/reports/assertCanViewReports";
import { getCircularsReportData } from "@/lib/reports/getCircularsReportData";
import { getMaintenanceReportData } from "@/lib/reports/getMaintenanceReportData";
import { buildCircularsCsv } from "@/lib/reports/buildCircularsCsv";
import { buildMaintenanceCsv } from "@/lib/reports/buildMaintenanceCsv";
import { parseReportExportFilters } from "@/lib/reports/parseReportExportFilters";

async function handleReportExport(request: Request) {
  const authCheck = await assertCanViewReports();
  if (!authCheck.authorized) {
    throw new ForbiddenError(authCheck.error || "Unauthorized");
  }

  const { searchParams } = new URL(request.url);
  const type = searchParams.get("type") ?? "circulars";
  const filters = parseReportExportFilters(searchParams, authCheck.scopedDepartmentId);

  let csvContent = "";
  let filename = `report-${Date.now()}.csv`;

  if (type === "maintenance") {
    const data = await getMaintenanceReportData(authCheck.schoolId, filters);
    csvContent = buildMaintenanceCsv(data.rows);
    filename = `maintenance-report-${Date.now()}.csv`;
  } else {
    const data = await getCircularsReportData(
      authCheck.schoolId,
      filters,
      authCheck.scopedDepartmentId,
    );
    csvContent = buildCircularsCsv(data.rows);
    filename = `circulars-report-${Date.now()}.csv`;
  }

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

export const GET = withApiErrorHandler(handleReportExport);
