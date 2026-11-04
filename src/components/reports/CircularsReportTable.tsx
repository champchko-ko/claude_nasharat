import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TABLE_HEAD_ROW, TABLE_WRAP, EMPTY_PANEL } from "@/components/ui/table-styles";
import { CircularReportTableRow } from "./CircularReportTableRow";
import type { CircularReportRow } from "@/lib/reports/types";

export function CircularsReportTable({ rows }: { rows: CircularReportRow[] }) {
  const t = useTranslations("reports");

  if (!rows.length) {
    return <div className={EMPTY_PANEL}>{t("noData")}</div>;
  }

  return (
    <div className={TABLE_WRAP}>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_HEAD_ROW}>
            <TableHead>{t("table.ref")}</TableHead>
            <TableHead>{t("table.title")}</TableHead>
            <TableHead>{t("table.priority")}</TableHead>
            <TableHead>{t("table.status")}</TableHead>
            <TableHead className="text-center">{t("table.targeted")}</TableHead>
            <TableHead className="text-center">{t("table.responded")}</TableHead>
            <TableHead className="text-end">{t("table.compliance")}</TableHead>
            <TableHead className="w-12 text-center" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <CircularReportTableRow key={row.id} row={row} />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
