"use client";

import { useTranslations } from "next-intl";
import { CheckCircle2Icon, PlayIcon, PauseIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { MaintenanceStatus } from "@/lib/maintenance/types";

export function OperatorStatusButtons({
  status,
  isAssignedOrAdmin,
  isPending,
  onOpenAction,
  onDirectTransition,
}: {
  status: MaintenanceStatus;
  isAssignedOrAdmin: boolean;
  isPending: boolean;
  onOpenAction: (action: MaintenanceStatus) => void;
  onDirectTransition: (target: MaintenanceStatus) => void;
}) {
  const t = useTranslations("maintenance.actions");

  if (!isAssignedOrAdmin) return null;

  if (status === "assigned" || status === "waiting_for_parts" || status === "reopened") {
    return (
      <Button
        size="sm"
        disabled={isPending}
        onClick={() => onDirectTransition("in_progress")}
        className="bg-warning text-warning-foreground"
      >
        <PlayIcon className="size-4" />
        <span>{t("startWork")}</span>
      </Button>
    );
  }

  if (status === "in_progress") {
    return (
      <>
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onDirectTransition("waiting_for_parts")}
        >
          <PauseIcon className="size-4" />
          <span>{t("waitForParts")}</span>
        </Button>
        <Button
          size="sm"
          disabled={isPending}
          onClick={() => onOpenAction("resolved")}
          className="bg-success text-success-foreground"
        >
          <CheckCircle2Icon className="size-4" />
          <span>{t("resolve")}</span>
        </Button>
      </>
    );
  }

  return null;
}
