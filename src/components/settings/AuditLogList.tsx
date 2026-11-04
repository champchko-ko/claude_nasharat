import { getTranslations } from "next-intl/server";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import type { AuditLogResult, AuditLogFilters } from "@/lib/school/getSchoolAuditLogs";
import { AuditLogFiltersBar } from "./AuditLogFiltersBar";
import { AuditLogExportButton } from "./AuditLogExportButton";
import { AuditLogPagination } from "./AuditLogPagination";

export async function AuditLogList({
  result,
  filters,
}: {
  result: AuditLogResult;
  filters?: AuditLogFilters;
}) {
  const t = await getTranslations("settings");
  const tCommon = await getTranslations("common");

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1">
          <AuditLogFiltersBar initialFilters={filters} />
        </div>
        <div className="self-end sm:self-auto">
          <AuditLogExportButton filters={filters} />
        </div>
      </div>

      {result.logs.length === 0 ? (
        <div className="rounded-lg border border-dashed border-border p-8 text-center text-muted-foreground">
          {tCommon("noData")}
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-44">{t("action")}</TableHead>
                <TableHead className="w-48">{t("entity")}</TableHead>
                <TableHead>{t("actor")}</TableHead>
                <TableHead className="w-56 text-end">{t("date")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {result.logs.map((log) => {
                const formattedDate = new Date(log.created_at).toLocaleString();

                return (
                  <TableRow key={log.id}>
                    <TableCell>
                      <Badge variant="outline" className="font-mono text-xs uppercase">
                        {log.action}
                      </Badge>
                    </TableCell>
                    <TableCell className="font-medium text-foreground">
                      <span className="font-mono text-xs">{log.entity_type}</span>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {log.actor_label || log.actor_id || "System"}
                    </TableCell>
                    <TableCell className="text-end font-mono text-xs text-muted-foreground">
                      {formattedDate}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}

      <AuditLogPagination
        page={result.page}
        totalPages={result.totalPages}
        totalCount={result.totalCount}
        filters={filters}
      />
    </div>
  );
}
