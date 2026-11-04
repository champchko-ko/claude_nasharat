"use client";

import type { MaintenanceRequestRow } from "@/lib/maintenance/types";

/** Maintenance list of the trial dashboard stat modal. */
export function NewDashboardMaintenanceList({
  maintenance,
}: {
  maintenance: MaintenanceRequestRow[];
}) {
  return (
    <div className="space-y-2">
      {maintenance.slice(0, 5).map((m) => (
        <div
          key={m.id}
          className="flex items-center justify-between rounded-lg border bg-muted/30 p-2.5"
        >
          <div>
            <div className="text-xs font-bold text-foreground">{m.title}</div>
            <div className="text-[10px] text-muted-foreground">
              تذكرة: {m.ticket_number} · الفئة: {m.category}
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-600">{m.status}</span>
        </div>
      ))}
    </div>
  );
}
