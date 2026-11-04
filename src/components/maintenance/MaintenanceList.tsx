"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { SearchIcon, WrenchIcon } from "lucide-react";
import { Table, TableBody, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PANEL } from "@/components/ui/diamond-card-styles";
import { MaintenanceTableRow } from "./MaintenanceTableRow";
import { MaintenanceListHeader } from "./MaintenanceListHeader";
import { filterMaintenanceTickets } from "@/lib/maintenance/filterMaintenanceTickets";
import type { MaintenanceRequestRow } from "@/lib/maintenance/types";

export function MaintenanceList({
  tickets,
  canCreate,
}: {
  tickets: MaintenanceRequestRow[];
  canCreate: boolean;
}) {
  const t = useTranslations("maintenance");
  const tCommon = useTranslations("common");

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const filteredTickets = tickets.filter((tk) =>
    filterMaintenanceTickets(tk, search, statusFilter),
  );

  return (
    <div className="space-y-6">
      <MaintenanceListHeader canCreate={canCreate} />

      <div
        className={`${PANEL} flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="relative max-w-sm flex-1">
          <SearchIcon className="absolute start-3 top-2.5 size-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={tCommon("search")}
            className="ps-9"
          />
        </div>

        <div className="flex flex-wrap gap-1.5">
          {["all", "emergency", "in_progress", "resolved", "closed"].map((f) => (
            <Button
              key={f}
              variant={statusFilter === f ? "default" : "outline"}
              size="sm"
              onClick={() => setStatusFilter(f)}
            >
              {f === "all"
                ? t("filterAll")
                : f === "emergency"
                  ? t("priorities.emergency")
                  : t(`statuses.${f}`)}
            </Button>
          ))}
        </div>
      </div>

      {filteredTickets.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-[color:var(--panel,var(--card))] p-12 text-center">
          <WrenchIcon className="mb-3 size-10 text-muted-foreground/60" />
          <p className="text-sm font-medium text-foreground">{t("noTickets")}</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-[0_12px_30px_rgba(20,37,74,.10)]">
          <Table>
            <TableHeader>
              <TableRow className="border-b-0 bg-[linear-gradient(90deg,var(--topbar-from,var(--sidebar)),var(--topbar-to,var(--sidebar)))] hover:bg-transparent [&_th]:h-11 [&_th]:px-3 [&_th]:font-bold [&_th]:text-sidebar-foreground">
                <TableHead>{t("ticketNumber")}</TableHead>
                <TableHead>{t("ticketTitle")}</TableHead>
                <TableHead>{t("location")}</TableHead>
                <TableHead>{t("priority")}</TableHead>
                <TableHead>{t("status")}</TableHead>
                <TableHead>{t("reporter")}</TableHead>
                <TableHead>{t("createdAt")}</TableHead>
                <TableHead className="text-end">{tCommon("actions")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredTickets.map((tk) => (
                <MaintenanceTableRow key={tk.id} ticket={tk} />
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
