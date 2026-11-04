"use client";

import { useTranslations } from "next-intl";
import { CalendarIcon } from "lucide-react";
import { PANEL } from "@/components/ui/diamond-card-styles";
import { CalendarEventCard } from "./CalendarEventCard";
import { CalendarCircularCard } from "./CalendarCircularCard";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";

export function CalendarListView({
  items,
  canManage,
  onSelectItem,
}: {
  items: UnifiedCalendarItem[];
  canManage: boolean;
  onSelectItem?: (item: UnifiedCalendarItem) => void;
}) {
  const t = useTranslations("calendar");

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border bg-[color:var(--panel,var(--card))] p-12 text-center">
        <CalendarIcon className="mb-3 size-10 text-muted-foreground/60" />
        <p className="text-sm font-medium text-foreground">{t("noEvents")}</p>
      </div>
    );
  }

  return (
    <div className={`${PANEL} p-5 pt-12 sm:p-8 sm:pt-14`}>
      <div className="grid grid-cols-1 gap-x-6 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
        {items.map((item) =>
          item.kind === "event" ? (
            <CalendarEventCard
              key={item.id}
              event={item.event}
              canManage={canManage}
              onSelect={() => onSelectItem?.(item)}
            />
          ) : (
            <CalendarCircularCard
              key={item.id}
              circular={item.circular}
              onSelect={() => onSelectItem?.(item)}
            />
          ),
        )}
      </div>
    </div>
  );
}
