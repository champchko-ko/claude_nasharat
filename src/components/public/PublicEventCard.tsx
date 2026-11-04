import { CalendarDaysIcon, CalendarIcon, MapPinIcon } from "lucide-react";
import { CalendarEventCategoryBadge } from "@/components/calendar/CalendarEventCategoryBadge";
import type { CalendarEventRow } from "@/lib/calendar/types";
import { CARD_DIAMOND, CARD_DIAMOND_ICON, CARD_RULE, CARD_SHELL } from "./publicCardStyles";

export function PublicEventCard({
  event,
  locale,
}: {
  event: CalendarEventRow;
  locale: string;
}) {
  const title = locale === "ar" ? event.title_ar : (event.title_en || event.title_ar);
  const dateLabel = new Date(event.starts_at).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
    { weekday: "short", day: "numeric", month: "short" },
  );

  return (
    <div className={`${CARD_SHELL} h-full px-5 pt-16 pb-0 sm:pt-[4.5rem]`}>
      <div className={CARD_DIAMOND}>
        <CalendarDaysIcon className={`size-6 ${CARD_DIAMOND_ICON}`} />
      </div>

      <div className="mb-3">
        <CalendarEventCategoryBadge category={event.category} />
      </div>

      <h3 className="mb-3 line-clamp-2 text-base font-extrabold leading-relaxed tracking-tight text-foreground sm:text-lg">
        {title}
      </h3>
      <div className={CARD_RULE} />

      <div className="mb-5 w-full flex-1">
        {event.description && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {event.description}
          </p>
        )}
      </div>

      <div className="-mx-5 flex min-h-12 w-[calc(100%+2.5rem)] flex-col items-center justify-center gap-1 rounded-b-[11px] bg-[color:var(--card-bar,#e6e9f1)] px-5 py-3 text-sm font-bold text-[color:var(--card-bar-foreground,#3d6db8)] transition-colors duration-[400ms] ease-[cubic-bezier(.22,1,.36,1)] group-hover:bg-[linear-gradient(90deg,var(--action-from,#0b63d6)_-20%,var(--action-to,#0a2f7a)_120%)] group-hover:text-[color:var(--action-foreground,#fff)]">
        <span className="flex items-center gap-2">
          <CalendarIcon className="size-4 shrink-0" />
          <span>{dateLabel}</span>
        </span>
        {event.location && (
          <span className="flex max-w-full items-center gap-2 text-xs font-medium">
            <MapPinIcon className="size-3.5 shrink-0" />
            <span className="truncate">{event.location}</span>
          </span>
        )}
      </div>
    </div>
  );
}
