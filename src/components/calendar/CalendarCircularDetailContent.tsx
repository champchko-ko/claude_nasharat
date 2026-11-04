"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ClockIcon, CheckCircle2Icon, ExternalLinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CircularPriorityBadge } from "@/components/circulars/CircularPriorityBadge";
import type { CircularRow } from "@/lib/circulars/types";

export function CalendarCircularDetailContent({
  circular,
  onClose,
}: {
  circular: CircularRow;
  onClose: () => void;
}) {
  const locale = useLocale();
  const tCommon = useTranslations("common");

  const formattedDeadline = circular.due_at
    ? new Date(circular.due_at).toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : null;

  return (
    <div className="mt-5 space-y-5">
      <div className="flex flex-wrap items-center gap-2">
        <CircularPriorityBadge priority={circular.priority} />
        <Badge variant="outline" className="font-mono text-xs">
          {circular.ref_number}
        </Badge>
        <Badge variant="secondary" className="text-xs">
          {circular.category}
        </Badge>
      </div>

      <div className="space-y-2 rounded-lg border border-border/60 bg-muted/30 p-3.5 text-xs text-muted-foreground">
        {formattedDeadline && (
          <div className="flex items-center gap-2 font-medium text-destructive">
            <ClockIcon className="size-4 shrink-0" />
            <span>Deadline: {formattedDeadline}</span>
          </div>
        )}
        <div className="flex items-center gap-2">
          <CheckCircle2Icon className="size-4 shrink-0 text-primary" />
          <span>Response Required: {circular.response_type}</span>
        </div>
      </div>

      {circular.body && (
        <div className="space-y-1.5">
          <h4 className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
            Instructions & Excerpt
          </h4>
          <p className="line-clamp-6 rounded-lg border border-border bg-background p-3 text-sm whitespace-pre-wrap text-foreground">
            {circular.body}
          </p>
        </div>
      )}

      <div className="flex justify-end gap-2 border-t border-border pt-2">
        <Button variant="outline" onClick={onClose}>
          {tCommon("cancel")}
        </Button>
        <Link href={`/${locale}/circulars/${circular.id}`}>
          <Button className="gap-2">
            <ExternalLinkIcon className="size-4" />
            <span>View & Respond</span>
          </Button>
        </Link>
      </div>
    </div>
  );
}
