"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import type { MaintenanceStatus } from "@/lib/maintenance/types";

const STATUS_VARIANTS: Record<
  MaintenanceStatus,
  {
    variant: "default" | "secondary" | "destructive" | "outline";
    className: string;
  }
> = {
  submitted: {
    variant: "secondary",
    className: "bg-secondary text-secondary-foreground",
  },
  triaged: {
    variant: "secondary",
    className: "bg-chart-3/15 text-chart-3",
  },
  assigned: {
    variant: "secondary",
    className: "bg-chart-2/15 text-chart-2",
  },
  in_progress: {
    variant: "default",
    className: "bg-warning text-warning-foreground",
  },
  waiting_for_parts: {
    variant: "outline",
    className: "border-warning text-warning",
  },
  resolved: {
    variant: "default",
    className: "bg-success text-success-foreground",
  },
  closed: {
    variant: "outline",
    className: "bg-muted/50 text-muted-foreground dark:bg-muted border-border",
  },
  reopened: {
    variant: "destructive",
    className: "bg-destructive text-destructive-foreground",
  },
  rejected: {
    variant: "destructive",
    className: "bg-destructive text-destructive-foreground",
  },
};

export function MaintenanceStatusBadge({ status }: { status: MaintenanceStatus }) {
  const t = useTranslations("maintenance.statuses");
  const config = STATUS_VARIANTS[status] ?? STATUS_VARIANTS.submitted;

  return (
    <Badge variant={config.variant} className={config.className}>
      {t(status)}
    </Badge>
  );
}
