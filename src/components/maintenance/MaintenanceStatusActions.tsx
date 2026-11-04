"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { GoldDots } from "@/components/ui/gold-dots";
import { MaintenanceStatusButtons } from "./MaintenanceStatusButtons";
import { MaintenanceReasonForm } from "./MaintenanceReasonForm";
import { updateMaintenanceStatusAction } from "@/actions/maintenance/updateMaintenanceStatusAction";
import type { MaintenanceStatus } from "@/lib/maintenance/types";

export function MaintenanceStatusActions({
  requestId,
  status,
  isReporter,
  isOperator,
  canAssign,
  canClose,
}: {
  requestId: string;
  status: MaintenanceStatus;
  isReporter: boolean;
  isOperator: boolean;
  canAssign: boolean;
  canClose: boolean;
}) {
  const t = useTranslations("maintenance");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [activeAction, setActiveAction] = useState<MaintenanceStatus | null>(null);

  const handleAction = (formData: FormData) => {
    startTransition(async () => {
      const res = await updateMaintenanceStatusAction(formData);
      if (res.success) {
        toast.success(tCommon("saved"));
        setActiveAction(null);
      } else {
        toast.error(res.error || tCommon("error"));
      }
    });
  };

  const handleDirectTransition = (target: MaintenanceStatus) => {
    const formData = new FormData();
    formData.set("request_id", requestId);
    formData.set("target_status", target);
    handleAction(formData);
  };

  const isAssignedOrAdmin = isOperator || canAssign;
  const canReopen = isReporter || canAssign || canClose;

  return (
    <div className="space-y-4 rounded-xl border border-border bg-card p-6 shadow-[0_12px_30px_rgba(20,37,74,.10)]">
      <h3 className="flex items-center gap-2.5 border-b border-border pb-3 font-heading font-extrabold text-primary">
        <span>
          {t("actions.startWork")} / {t("status")}
        </span>
        <GoldDots />
      </h3>

      <MaintenanceStatusButtons
        status={status}
        isAssignedOrAdmin={isAssignedOrAdmin}
        canAssign={canAssign}
        canClose={canClose}
        canReopen={canReopen}
        isPending={isPending}
        onOpenAction={(action) => setActiveAction(activeAction === action ? null : action)}
        onDirectTransition={handleDirectTransition}
      />

      {activeAction && (
        <MaintenanceReasonForm
          requestId={requestId}
          activeAction={activeAction}
          isPending={isPending}
          onCancel={() => setActiveAction(null)}
          onSubmit={handleAction}
        />
      )}
    </div>
  );
}
