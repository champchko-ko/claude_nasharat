"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { EyeIcon } from "lucide-react";
import { TableCell, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { MaintenancePriorityBadge } from "./MaintenancePriorityBadge";
import { MaintenanceStatusBadge } from "./MaintenanceStatusBadge";
import { formatLocation } from "@/lib/maintenance/formatLocation";
import type { MaintenanceRequestRow } from "@/lib/maintenance/types";

export function MaintenanceTableRow({ ticket }: { ticket: MaintenanceRequestRow }) {
  const locale = useLocale();
  const tCat = useTranslations("maintenance.categories");
  const categoryLabel = tCat.has(ticket.category)
    ? tCat(ticket.category as never)
    : ticket.category;
  const locationLabel = formatLocation(ticket.location);

  return (
    <TableRow className="group transition-colors hover:bg-[color:var(--panel,var(--muted))] [&>td]:px-3 [&>td]:py-3">
      <TableCell className="font-mono text-xs font-semibold text-primary">
        {ticket.ticket_number}
      </TableCell>
      <TableCell className="max-w-[200px]">
        <div className="truncate font-medium text-foreground">{ticket.title}</div>
        <div className="text-xs text-muted-foreground">{categoryLabel}</div>
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">{locationLabel}</TableCell>
      <TableCell>
        <MaintenancePriorityBadge priority={ticket.priority} />
      </TableCell>
      <TableCell>
        <MaintenanceStatusBadge status={ticket.status} />
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {ticket.reporter?.full_name ?? "—"}
      </TableCell>
      <TableCell className="text-xs text-muted-foreground">
        {new Date(ticket.created_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US")}
      </TableCell>
      <TableCell className="text-end">
        <Link
          href={`/${locale}/maintenance/${ticket.id}`}
          className="inline-flex items-center gap-1"
        >
          <Button variant="ghost" size="sm">
            <EyeIcon className="size-4" />
          </Button>
        </Link>
      </TableCell>
    </TableRow>
  );
}
