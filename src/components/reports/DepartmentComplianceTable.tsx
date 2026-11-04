import { useTranslations } from "next-intl";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { GoldDots } from "@/components/ui/gold-dots";
import {
  TABLE_BODY_ROW,
  TABLE_HEAD_ROW,
  TABLE_WRAP,
  EMPTY_PANEL,
} from "@/components/ui/table-styles";
import type { DepartmentComplianceItem } from "@/lib/reports/types";

export function DepartmentComplianceTable({ items }: { items: DepartmentComplianceItem[] }) {
  const t = useTranslations("reports");

  if (!items.length) {
    return <div className={EMPTY_PANEL}>{t("noData")}</div>;
  }

  return (
    <div className={TABLE_WRAP}>
      <div className="flex items-center gap-2.5 border-b border-border bg-[color:var(--panel,var(--muted))] px-4 py-3.5">
        <h3 className="font-heading text-base font-extrabold text-primary">
          {t("complianceTable")}
        </h3>
        <GoldDots />
      </div>
      <Table>
        <TableHeader>
          <TableRow className={TABLE_HEAD_ROW}>
            <TableHead>{t("table.department")}</TableHead>
            <TableHead className="text-center">{t("table.targeted")}</TableHead>
            <TableHead className="text-center">{t("table.responded")}</TableHead>
            <TableHead className="text-center">{t("table.pending")}</TableHead>
            <TableHead className="text-end">{t("table.compliance")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.map((item) => (
            <TableRow key={item.departmentId} className={TABLE_BODY_ROW}>
              <TableCell className="font-medium text-foreground">{item.departmentName}</TableCell>
              <TableCell className="text-center">{item.targeted}</TableCell>
              <TableCell className="text-center text-success">{item.compliant}</TableCell>
              <TableCell className="text-center text-warning">
                {item.overdue + item.notYetDue}
              </TableCell>
              <TableCell className="text-end font-semibold">
                <span
                  className={
                    item.percent === null
                      ? "text-muted-foreground"
                      : item.percent >= 80
                        ? "text-success"
                        : item.percent >= 50
                          ? "text-warning"
                          : "text-destructive"
                  }
                >
                  {item.percent === null ? "—" : `${item.percent}%`}
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
