"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { CheckCircle2Icon, ClockIcon, FileTextIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import {
  CARD_DIAMOND,
  CARD_DIAMOND_ICON,
  CARD_FOOTER_BAR,
  CARD_RULE,
  CARD_SHELL,
} from "@/components/ui/diamond-card-styles";
import { CircularPriorityBadge } from "@/components/circulars/CircularPriorityBadge";
import type { CircularRow } from "@/lib/circulars/types";

export function CalendarCircularCard({
  circular,
  onSelect,
}: {
  circular: CircularRow;
  onSelect?: () => void;
}) {
  const locale = useLocale();
  const tCirc = useTranslations("circulars");

  const deadline = circular.due_at ? new Date(circular.due_at) : null;
  const formattedDeadline = deadline
    ? deadline.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        weekday: "short",
        month: "short",
        day: "numeric",
      })
    : null;

  return (
    <div className={`${CARD_SHELL} h-full px-5 pt-16 pb-0 sm:pt-[4.5rem]`}>
      <div className={CARD_DIAMOND}>
        <FileTextIcon className={`size-6 ${CARD_DIAMOND_ICON}`} />
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-center gap-1.5">
        <Badge variant="outline" className="border-chart-4/40 text-chart-4">
          <FileTextIcon className="me-1 size-3" />
          {tCirc("title")}
        </Badge>
        <CircularPriorityBadge priority={circular.priority} />
        <Badge variant="outline" className="font-mono text-xs">
          {circular.ref_number}
        </Badge>
      </div>

      <button
        type="button"
        onClick={onSelect}
        className="text-base leading-relaxed font-extrabold text-primary hover:underline sm:text-lg"
      >
        <h3>{circular.title}</h3>
      </button>
      <div className={`mt-3 ${CARD_RULE}`} />

      <div className="mb-4 w-full flex-1 space-y-3">
        {circular.body && (
          <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
            {circular.body}
          </p>
        )}
        <div className="flex flex-wrap items-center justify-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {formattedDeadline && (
            <span className="flex items-center gap-1.5 font-medium text-destructive">
              <ClockIcon className="size-3.5" />
              {tCirc("dueDate")}: {formattedDeadline}
            </span>
          )}
          <span className="flex items-center gap-1.5">
            <CheckCircle2Icon className="size-3.5 text-chart-4" />
            {circular.response_type}
          </span>
        </div>
      </div>

      <Link href={`/${locale}/circulars/${circular.id}`} className={CARD_FOOTER_BAR}>
        {tCirc("respond")}
      </Link>
    </div>
  );
}
