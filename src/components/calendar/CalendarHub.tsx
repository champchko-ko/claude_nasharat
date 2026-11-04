"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { PlusIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PageHeader } from "@/components/ui/page-header";
import { CalendarEventsView } from "./CalendarEventsView";
import type { CalendarEventRow } from "@/lib/calendar/types";
import type { CircularRow } from "@/lib/circulars/types";

export function CalendarHub({
  events,
  circulars = [],
  canManageEvents = false,
}: {
  events: CalendarEventRow[];
  circulars?: CircularRow[];
  canManageEvents?: boolean;
}) {
  const t = useTranslations("calendar");
  const locale = useLocale();

  return (
    <div className="space-y-6">
      <PageHeader
        title={t("title")}
        subtitle={t("description")}
        action={
          canManageEvents ? (
            <Link href={`/${locale}/calendar/new`}>
              <Button className="gap-2">
                <PlusIcon className="size-4" />
                <span>{t("newEvent")}</span>
              </Button>
            </Link>
          ) : null
        }
      />

      <CalendarEventsView events={events} circulars={circulars} canManage={canManageEvents} />
    </div>
  );
}
