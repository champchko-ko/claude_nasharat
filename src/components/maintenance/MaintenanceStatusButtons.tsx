"use client";

import { useTranslations } from "next-intl";
import { XCircleIcon, RotateCcwIcon, ArchiveIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { OperatorStatusButtons } from "./OperatorStatusButtons";
import type { MaintenanceStatus } from "@/lib/maintenance/types";

export function MaintenanceStatusButtons({
  status,
  isAssignedOrAdmin,
  canAssign,
  canClose,
  canReopen,
  isPending,
  onOpenAction,
  onDirectTransition,
}: {
  status: MaintenanceStatus;
  isAssignedOrAdmin: boolean;
  canAssign: boolean;
  canClose: boolean;
  canReopen: boolean;
  isPending: boolean;
  onOpenAction: (action: MaintenanceStatus) => void;
  onDirectTransition: (target: MaintenanceStatus) => void;
}) {
  const t = useTranslations("maintenance.actions");

  return (
    <div className="flex flex-wrap gap-2">
      {status === "submitted" && canAssign && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onOpenAction("rejected")}
          className="text-destructive hover:bg-destructive/10"
        >
          <XCircleIcon className="size-4" />
          <span>{t("reject")}</span>
        </Button>
      )}

      <OperatorStatusButtons
        status={status}
        isAssignedOrAdmin={isAssignedOrAdmin}
        isPending={isPending}
        onOpenAction={onOpenAction}
        onDirectTransition={onDirectTransition}
      />

      {status === "resolved" && canClose && (
        <Button size="sm" disabled={isPending} onClick={() => onDirectTransition("closed")}>
          <ArchiveIcon className="size-4" />
          <span>{t("close")}</span>
        </Button>
      )}

      {(status === "resolved" || status === "closed") && canReopen && (
        <Button
          variant="outline"
          size="sm"
          disabled={isPending}
          onClick={() => onOpenAction("reopened")}
          className="text-destructive"
        >
          <RotateCcwIcon className="size-4" />
          <span>{t("reopen")}</span>
        </Button>
      )}
    </div>
  );
}
