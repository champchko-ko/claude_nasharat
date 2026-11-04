"use client";

import type { CalendarEventRow } from "@/lib/calendar/types";

/** Event list shown inside the trial dashboard stat modal. */
export function NewDashboardEventStatList({ events }: { events: CalendarEventRow[] }) {
  return (
    <div className="space-y-2">
      {events.slice(0, 5).map((ev) => (
        <div
          key={ev.id}
          className="flex items-center justify-between rounded-lg border bg-muted/30 p-2.5"
        >
          <div>
            <div className="text-xs font-bold text-foreground">{ev.title_ar}</div>
            <div className="text-[10px] text-muted-foreground">
              {new Date(ev.starts_at).toLocaleDateString("ar-KW")} · {ev.location}
            </div>
          </div>
          <span className="text-[11px] font-bold text-purple-600">معتمد</span>
        </div>
      ))}
    </div>
  );
}
