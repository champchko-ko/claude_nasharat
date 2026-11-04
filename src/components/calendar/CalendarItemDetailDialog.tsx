"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon, XIcon, FileTextIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDrawerEscape } from "@/components/layout/useDrawerEscape";
import { getCalendarItemTitle } from "./getCalendarItemTitle";
import { CalendarEventDetailContent } from "./CalendarEventDetailContent";
import { CalendarCircularDetailContent } from "./CalendarCircularDetailContent";
import type { UnifiedCalendarItem } from "@/lib/calendar/types";

export function CalendarItemDetailDialog({
  item,
  isOpen,
  canManage = false,
  onClose,
}: {
  item: UnifiedCalendarItem | null;
  isOpen: boolean;
  canManage?: boolean;
  onClose: () => void;
}) {
  const locale = useLocale();
  const tCal = useTranslations("calendar");
  const tCirc = useTranslations("circulars");

  useDrawerEscape(onClose, isOpen && Boolean(item));

  if (!isOpen || !item) return null;

  const isEvent = item.kind === "event";
  const itemTitle = getCalendarItemTitle(item, locale);

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="fixed inset-0 bg-scrim/60 backdrop-blur-xs" onClick={onClose} />
      <div className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-xl border border-border bg-card p-6 shadow-2xl">
        <div className="flex items-start justify-between gap-4 border-b border-border pb-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              {isEvent ? (
                <CalendarIcon className="size-5 text-primary" />
              ) : (
                <FileTextIcon className="size-5 text-chart-4" />
              )}
              <span className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
                {isEvent ? tCal("title") : tCirc("title")}
              </span>
            </div>
            <h2 className="text-xl font-bold text-foreground">{itemTitle}</h2>
          </div>
          <Button variant="ghost" size="icon" onClick={onClose} className="rounded-full">
            <XIcon className="size-5" />
          </Button>
        </div>

        {isEvent ? (
          <CalendarEventDetailContent event={item.event} canManage={canManage} onClose={onClose} />
        ) : (
          <CalendarCircularDetailContent circular={item.circular} onClose={onClose} />
        )}
      </div>
    </div>
  );
}
