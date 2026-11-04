"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ChevronDownIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { TABLE_BODY_ROW } from "@/components/ui/table-styles";
import { Link } from "@/i18n";
import { CircularPriorityBadge } from "@/components/circulars/CircularPriorityBadge";
import { CircularStatusBadge } from "@/components/circulars/CircularStatusBadge";
import type { CircularReportRow } from "@/lib/reports/types";
import { CircularReportExpandedDepts } from "./CircularReportExpandedDepts";

export function CircularReportTableRow({ row }: { row: CircularReportRow }) {
  const t = useTranslations("circulars");
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <TableRow className={TABLE_BODY_ROW}>
        <TableCell className="font-mono text-xs font-semibold text-primary">
          <Link href={`/circulars/${row.id}`} className="hover:text-primary hover:underline">
            {row.refNumber}
          </Link>
        </TableCell>
        <TableCell className="font-medium text-foreground">{row.title}</TableCell>
        <TableCell>
          <CircularPriorityBadge priority={row.priority as never} />
        </TableCell>
        <TableCell>
          <CircularStatusBadge status={row.status as never} />
        </TableCell>
        <TableCell className="text-center">{row.targeted}</TableCell>
        <TableCell className="text-center font-medium text-success">{row.compliant}</TableCell>
        <TableCell className="text-end">
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-extrabold ${
              row.percent === null
                ? "bg-muted text-muted-foreground"
                : row.percent >= 80
                  ? "bg-success/15 text-success"
                  : row.percent >= 50
                    ? "bg-warning/15 text-warning"
                    : "bg-destructive/15 text-destructive"
            }`}
          >
            {row.percent === null ? "—" : `${row.percent}%`}
          </span>
        </TableCell>
        <TableCell className="w-12 text-center">
          <button
            type="button"
            onClick={() => setExpanded(!expanded)}
            aria-expanded={expanded}
            aria-label={t("whoResponded")}
            className={`inline-flex size-8 items-center justify-center rounded-full border transition-[transform,box-shadow,background-color,color] duration-300 ease-[cubic-bezier(.22,1,.36,1)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
              expanded
                ? "border-transparent bg-[linear-gradient(180deg,var(--action-from,#0b63d6)_-40%,var(--action-to,#0a2f7a)_120%)] text-[color:var(--action-foreground,#fff)] shadow-[0_6px_14px_rgba(10,47,122,.3)]"
                : "border-border bg-card text-primary hover:-translate-y-0.5 hover:shadow-[0_6px_14px_rgba(20,37,74,.12)]"
            }`}
          >
            <ChevronDownIcon
              className={`size-4 transition-transform duration-300 ${expanded ? "rotate-180" : ""}`}
            />
          </button>
        </TableCell>
      </TableRow>

      {expanded && (
        <TableRow className="border-b border-border bg-[color:var(--panel,var(--muted))]">
          <TableCell colSpan={8} className="p-4 sm:p-5">
            <CircularReportExpandedDepts
              responded={row.respondedDepartments ?? []}
              pending={row.pendingDepartments ?? []}
            />
          </TableCell>
        </TableRow>
      )}
    </>
  );
}
