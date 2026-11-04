"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { CalendarDaysIcon } from "lucide-react";
import {
  CARD_DIAMOND,
  CARD_DIAMOND_ICON,
  CARD_FOOTER_BAR,
  CARD_RULE,
  CARD_SHELL,
} from "@/components/ui/diamond-card-styles";
import { CalendarEventCategoryBadge } from "./CalendarEventCategoryBadge";
import { CalendarEventStatusBadge } from "./CalendarEventStatusBadge";
import { CalendarVisibilityBadge } from "./CalendarVisibilityBadge";
import { CalendarActionButtons } from "./CalendarActionButtons";
import { CalendarEventCardFooter } from "./CalendarEventCardFooter";
import type { CalendarEventRow } from "@/lib/calendar/types";

export function CalendarEventCard({
  event,
  canManage,
  onSelect,
}: {
  event: CalendarEventRow;
  canManage: boolean;
  onSelect?: () => void;
}) {
  const locale = useLocale();
  const title = locale === "ar" ? event.title_ar : event.title_en || event.title_ar;

  const titleClass =
    "text-base font-extrabold leading-relaxed text-primary hover:underline sm:text-lg";

  const footerClass = `${CARD_FOOTER_BAR} flex-col`;

  return (
    <div className={`${CARD_SHELL} h-full px-5 pt-16 pb-0 sm:pt-[4.5rem]`}>
      <div className={CARD_DIAMOND}>
        <CalendarDaysIcon className={`size-6 ${CARD_DIAMOND_ICON}`} />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
        <CalendarEventCategoryBadge category={event.category} />
        <CalendarVisibilityBadge visibility={event.visibility} />
        <CalendarEventStatusBadge status={event.status} />
      </div>

      {onSelect ? (
        <button type="button" onClick={onSelect} className={titleClass}>
          <h3>{title}</h3>
        </button>
      ) : (
        <Link href={`/${locale}/calendar/${event.id}`} className={titleClass}>
          <h3>{title}</h3>
        </Link>
      )}
      <div className={`mt-3 ${CARD_RULE}`} />

      <div className="mb-5 w-full flex-1">
        {event.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        )}
      </div>

      {canManage && (
        <div className="mb-4 flex w-full justify-center">
          <CalendarActionButtons eventId={event.id} status={event.status} canManage={canManage} />
        </div>
      )}

      {onSelect ? (
        <button type="button" onClick={onSelect} className={footerClass}>
          <CalendarEventCardFooter event={event} />
        </button>
      ) : (
        <Link href={`/${locale}/calendar/${event.id}`} className={footerClass}>
          <CalendarEventCardFooter event={event} />
        </Link>
      )}
    </div>
  );
}
