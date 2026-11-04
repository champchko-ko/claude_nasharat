"use client";

import { useLocale, useTranslations } from "next-intl";
import { MessageSquareIcon, ArrowRightIcon, UserIcon } from "lucide-react";
import { GoldDots } from "@/components/ui/gold-dots";
import type { MaintenanceUpdateRow } from "@/lib/maintenance/types";

export function MaintenanceTimeline({ updates }: { updates: MaintenanceUpdateRow[] }) {
  const t = useTranslations("maintenance");
  const locale = useLocale();

  if (updates.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-[0_12px_30px_rgba(20,37,74,.10)]">
      <h3 className="flex items-center gap-2.5 border-b border-border pb-3 font-heading font-extrabold text-primary">
        <span>{t("timeline")}</span>
        <GoldDots />
      </h3>

      <div className="space-y-4">
        {updates.map((up) => (
          <div key={up.id} className="relative flex items-start gap-3 ps-2">
            <div className="flex size-7 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--action-from,#0b63d6),var(--action-to,#0a2f7a))] text-[color:var(--action-foreground,#fff)]">
              {up.kind === "note" ? (
                <MessageSquareIcon className="size-3.5" />
              ) : (
                <UserIcon className="size-3.5" />
              )}
            </div>

            <div className="flex-1 rounded-md border border-border bg-background p-3 text-sm">
              <div className="mb-1 flex flex-wrap items-center justify-between gap-2">
                <span className="font-medium text-foreground">
                  {up.author?.full_name ?? "System"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {new Date(up.created_at).toLocaleString(locale === "ar" ? "ar-EG" : "en-US")}
                </span>
              </div>

              {up.kind === "status_change" && up.old_value && up.new_value && (
                <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-primary">
                  <span>{up.old_value}</span>
                  <ArrowRightIcon className="size-3 rtl:rotate-180" />
                  <span>{up.new_value}</span>
                </div>
              )}

              {up.reason && (
                <p className="whitespace-pre-wrap text-muted-foreground">{up.reason}</p>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
