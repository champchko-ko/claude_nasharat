"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { CalendarCategory } from "@/lib/calendar/types";

const CATEGORY_COLORS: Record<CalendarCategory, string> = {
  academic: "bg-info/15 text-info",
  exam: "bg-chart-3/15 text-chart-3",
  holiday: "bg-success/15 text-success",
  meeting: "bg-warning/15 text-warning",
  activity: "bg-destructive/15 text-destructive",
  event: "bg-chart-2/15 text-chart-2",
  other: "bg-secondary text-secondary-foreground",
};

export function CalendarEventCategoryBadge({ category }: { category: CalendarCategory }) {
  const t = useTranslations("calendar.categories");
  const className = CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other;

  return (
    <Badge variant="outline" className={`border-transparent font-medium ${className}`}>
      {t.has(category) ? t(category) : category}
    </Badge>
  );
}
