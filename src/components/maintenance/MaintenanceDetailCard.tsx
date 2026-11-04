"use client";

import { useTranslations } from "next-intl";
import { AlertCircleIcon } from "lucide-react";
import { MaintenancePriorityBadge } from "./MaintenancePriorityBadge";
import { MaintenanceStatusBadge } from "./MaintenanceStatusBadge";
import { MaintenanceDetailMetaGrid } from "./MaintenanceDetailMetaGrid";
import { GoldDots } from "@/components/ui/gold-dots";
import type { MaintenanceRequestRow } from "@/lib/maintenance/types";

export function MaintenanceDetailCard({ ticket }: { ticket: MaintenanceRequestRow }) {
  const t = useTranslations("maintenance");

  return (
    <div className="relative space-y-6 overflow-hidden rounded-xl border border-border bg-card p-6 pt-8 shadow-[0_12px_30px_rgba(20,37,74,.10)]">
      <div
        aria-hidden="true"
        className="absolute inset-x-0 top-0 h-1.5 bg-[linear-gradient(90deg,var(--action-from,#0b63d6),var(--action-to,#0a2f7a))]"
      />
      <div className="flex flex-col gap-3 border-b border-border pb-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="mb-1 font-mono text-sm font-semibold text-primary">
            {ticket.ticket_number}
          </div>
          <h2 className="font-heading text-xl font-extrabold text-primary">{ticket.title}</h2>
          <div className="mt-2 h-0.5 w-24 rounded-full bg-[linear-gradient(90deg,var(--rule-from,#b88a2a),var(--action-to,#0a2f7a))]" />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <MaintenancePriorityBadge priority={ticket.priority} />
          <MaintenanceStatusBadge status={ticket.status} />
        </div>
      </div>

      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-xs font-extrabold text-primary">
          {t("ticketDescription")}
          <GoldDots />
        </h3>
        <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
          {ticket.description}
        </p>
      </div>

      {ticket.rejection_reason && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <AlertCircleIcon className="size-4" />
            <span>{t("rejectionReason")}</span>
          </div>
          <p>{ticket.rejection_reason}</p>
        </div>
      )}

      {ticket.reopen_reason && (
        <div className="rounded-md border border-warning/30 bg-warning/10 p-3 text-sm text-warning">
          <div className="mb-1 flex items-center gap-2 font-medium">
            <AlertCircleIcon className="size-4" />
            <span>{t("reopenReason")}</span>
          </div>
          <p>{ticket.reopen_reason}</p>
        </div>
      )}

      <MaintenanceDetailMetaGrid ticket={ticket} />
    </div>
  );
}
