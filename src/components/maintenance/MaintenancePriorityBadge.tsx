"use client";

import { useTranslations } from "next-intl";
import { AlertCircleIcon, AlertTriangleIcon, ClockIcon, InfoIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { MaintenancePriority } from "@/lib/maintenance/types";

const PRIORITY_STYLES: Record<
  MaintenancePriority,
  {
    variant: "destructive" | "default" | "secondary" | "outline";
    className: string;
    icon: typeof AlertCircleIcon;
  }
> = {
  emergency: {
    variant: "destructive",
    className: "bg-destructive text-destructive-foreground animate-pulse",
    icon: AlertCircleIcon,
  },
  urgent: {
    variant: "default",
    className: "bg-warning text-warning-foreground",
    icon: AlertTriangleIcon,
  },
  medium: {
    variant: "secondary",
    className: "bg-info/15 text-info",
    icon: InfoIcon,
  },
  deferrable: {
    variant: "outline",
    className: "text-muted-foreground border-border",
    icon: ClockIcon,
  },
};

export function MaintenancePriorityBadge({ priority }: { priority: MaintenancePriority }) {
  const t = useTranslations("maintenance.priorities");
  const config = PRIORITY_STYLES[priority] ?? PRIORITY_STYLES.medium;
  const Icon = config.icon;

  return (
    <Badge
      variant={config.variant}
      className={`inline-flex items-center gap-1 font-medium ${config.className}`}
    >
      <Icon className="size-3.5" />
      <span>{t(priority)}</span>
    </Badge>
  );
}
