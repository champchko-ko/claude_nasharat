"use client";

import { useTranslations } from "next-intl";
import { GlobeIcon, LockIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { CalendarVisibility } from "@/lib/calendar/types";

export function CalendarVisibilityBadge({ visibility }: { visibility: CalendarVisibility }) {
  const t = useTranslations("calendar.visibilities");

  if (visibility === "public") {
    return (
      <Badge variant="outline" className="gap-1 border-info/30 text-info">
        <GlobeIcon className="size-3" />
        <span>{t("public")}</span>
      </Badge>
    );
  }

  return (
    <Badge variant="outline" className="gap-1 border-border text-muted-foreground">
      <LockIcon className="size-3" />
      <span>{t("internal")}</span>
    </Badge>
  );
}
