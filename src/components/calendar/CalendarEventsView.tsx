"use client";

import { useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { CalendarDaysIcon, ListIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PANEL } from "@/components/ui/diamond-card-styles";
import { CalendarCategoryFilterBar } from "./CalendarCategoryFilterBar";
import { CalendarMonthView } from "./CalendarMonthView";
import { CalendarListView } from "./CalendarListView";
import { CalendarItemDetailDialog } from "./CalendarItemDetailDialog";
import { buildUnifiedCalendarItems } from "@/lib/calendar/buildUnifiedCalendarItems";
import type { CalendarEventRow, UnifiedCalendarItem } from "@/lib/calendar/types";
import type { CircularRow } from "@/lib/circulars/types";

export function CalendarEventsView({
  events,
  circulars = [],
  canManage,
}: {
  events: CalendarEventRow[];
  circulars?: CircularRow[];
  canManage: boolean;
}) {
  const t = useTranslations("calendar");
  const [viewMode, setViewMode] = useState<"month" | "list">("month");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedItem, setSelectedItem] = useState<UnifiedCalendarItem | null>(null);

  const unifiedItems = useMemo(
    () => buildUnifiedCalendarItems(events, circulars),
    [events, circulars],
  );

  const filteredItems = unifiedItems.filter((item) => {
    if (selectedCategory === "all") return true;
    if (selectedCategory === "circular") return item.kind === "circular";
    return item.kind === "event" && item.event.category === selectedCategory;
  });

  return (
    <div className="space-y-6">
      <div className={`${PANEL} flex flex-wrap items-center justify-between gap-3 p-4`}>
        <CalendarCategoryFilterBar
          selectedCategory={selectedCategory}
          onSelectCategory={setSelectedCategory}
        />

        <div className="flex items-center rounded-lg border border-border bg-muted/40 p-1">
          <Button
            variant={viewMode === "month" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("month")}
            className="gap-1.5"
          >
            <CalendarDaysIcon className="size-4" />
            <span>{t("monthView")}</span>
          </Button>
          <Button
            variant={viewMode === "list" ? "default" : "ghost"}
            size="sm"
            onClick={() => setViewMode("list")}
            className="gap-1.5"
          >
            <ListIcon className="size-4" />
            <span>{t("listView")}</span>
          </Button>
        </div>
      </div>

      {viewMode === "month" ? (
        <CalendarMonthView
          items={filteredItems}
          onSelectItem={setSelectedItem}
          onViewMore={() => setViewMode("list")}
        />
      ) : (
        <CalendarListView
          items={filteredItems}
          canManage={canManage}
          onSelectItem={setSelectedItem}
        />
      )}

      <CalendarItemDetailDialog
        item={selectedItem}
        isOpen={Boolean(selectedItem)}
        canManage={canManage}
        onClose={() => setSelectedItem(null)}
      />
    </div>
  );
}
