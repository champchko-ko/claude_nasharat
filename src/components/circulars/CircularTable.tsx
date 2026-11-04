import { useTranslations } from "next-intl";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { CircularTableRow } from "./CircularTableRow";
import type { CircularRow } from "@/lib/circulars/types";

export function CircularTable({
  circulars,
  canManage,
  totalDepartments,
}: {
  circulars: CircularRow[];
  canManage: boolean;
  totalDepartments?: number;
}) {
  const t = useTranslations("circulars");
  const tCommon = useTranslations("common");

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_12px_30px_rgba(20,37,74,.10)]">
      <Table>
        <TableHeader>
          <TableRow className="border-b-0 bg-[linear-gradient(90deg,var(--topbar-from,var(--sidebar)),var(--topbar-to,var(--sidebar)))] hover:bg-transparent [&_th]:h-11 [&_th]:px-3 [&_th]:font-bold [&_th]:text-sidebar-foreground">
            <TableHead className="w-28">{t("refNumber")}</TableHead>
            <TableHead>{t("circularTitle")}</TableHead>
            <TableHead className="w-24">{t("priority")}</TableHead>
            <TableHead className="w-28">{t("status")}</TableHead>
            <TableHead className="w-48">{t("forwardedTo")}</TableHead>
            <TableHead className="w-28">{t("publishedAt")}</TableHead>
            <TableHead className="w-28">{t("dueDate")}</TableHead>
            <TableHead className="w-16 text-end">{tCommon("actions")}</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {circulars.map((circ) => (
            <CircularTableRow
              key={circ.id}
              circular={circ}
              canManage={canManage}
              totalDepartments={totalDepartments}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
