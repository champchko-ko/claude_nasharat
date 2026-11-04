"use client";

import type { CircularRow } from "@/lib/circulars/types";

/** Circular list of the trial dashboard stat modal. */
export function NewDashboardCircularList({ circulars }: { circulars: CircularRow[] }) {
  return (
    <div className="space-y-2">
      {circulars.slice(0, 5).map((c) => (
        <div
          key={c.id}
          className="flex items-center justify-between rounded-lg border bg-muted/30 p-2.5"
        >
          <div>
            <div className="text-xs font-bold text-foreground">{c.title}</div>
            <div className="text-[10px] text-muted-foreground">
              {new Date(c.created_at).toLocaleDateString("ar-KW")}
            </div>
          </div>
          <span className="text-[11px] font-bold text-blue-600">منشور</span>
        </div>
      ))}
    </div>
  );
}
