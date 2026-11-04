"use client";

import { useLocale, useTranslations } from "next-intl";
import { MapPinIcon, TagIcon, UserIcon, CalendarIcon } from "lucide-react";
import { formatLocation } from "@/lib/maintenance/formatLocation";
import { resolveCategoryLabel } from "@/lib/maintenance/resolveCategoryLabel";
import type { MaintenanceRequestRow } from "@/lib/maintenance/types";

export function MaintenanceDetailMetaGrid({ ticket }: { ticket: MaintenanceRequestRow }) {
  const locale = useLocale();
  const t = useTranslations("maintenance");
  const tCat = useTranslations("maintenance.categories");

  const categoryLabel = resolveCategoryLabel(ticket.category, tCat, tCat.has);
  const locationLabel = formatLocation(ticket.location);
  const operatorLabel = ticket.assigned_operator
    ? ticket.assigned_operator.full_name
    : t("unassigned");
  const reporterLabel = ticket.reporter ? ticket.reporter.full_name : "—";
  const createdDate = new Date(ticket.created_at).toLocaleDateString(
    locale === "ar" ? "ar-EG" : "en-US",
  );

  return (
    <div className="grid grid-cols-1 gap-4 rounded-xl border border-border bg-[color:var(--panel,var(--muted))] p-4 sm:grid-cols-2 lg:grid-cols-4">
      <div className="flex items-start gap-2.5">
        <MapPinIcon className="mt-0.5 size-4 text-primary" />
        <div className="text-xs">
          <div className="text-muted-foreground">{t("location")}</div>
          <div className="font-medium text-foreground">{locationLabel}</div>
          {ticket.area && <div className="text-muted-foreground">{ticket.area}</div>}
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <TagIcon className="mt-0.5 size-4 text-primary" />
        <div className="text-xs">
          <div className="text-muted-foreground">{t("category")}</div>
          <div className="font-medium text-foreground">{categoryLabel}</div>
          {ticket.asset_ref && (
            <div className="font-mono text-muted-foreground">{ticket.asset_ref}</div>
          )}
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <UserIcon className="mt-0.5 size-4 text-primary" />
        <div className="text-xs">
          <div className="text-muted-foreground">{t("reporter")}</div>
          <div className="font-medium text-foreground">{reporterLabel}</div>
          <div className="text-muted-foreground">
            {operatorLabel} ({t("assignedOperator")})
          </div>
        </div>
      </div>

      <div className="flex items-start gap-2.5">
        <CalendarIcon className="mt-0.5 size-4 text-primary" />
        <div className="text-xs">
          <div className="text-muted-foreground">{t("createdAt")}</div>
          <div className="font-medium text-foreground">{createdDate}</div>
        </div>
      </div>
    </div>
  );
}
