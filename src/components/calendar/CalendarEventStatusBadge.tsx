"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { CalendarStatus } from "@/lib/calendar/types";

export function CalendarEventStatusBadge({ status }: { status: CalendarStatus }) {
  const t = useTranslations("calendar.statuses");

  if (status === "published") {
    return (
      <Badge variant="default" className="bg-success text-success-foreground">
        {t("published")}
      </Badge>
    );
  }

  if (status === "cancelled") {
    return <Badge variant="destructive">{t("cancelled")}</Badge>;
  }

  if (status === "archived") {
    return <Badge variant="outline">{t("archived")}</Badge>;
  }

  return <Badge variant="secondary">{t("draft")}</Badge>;
}
