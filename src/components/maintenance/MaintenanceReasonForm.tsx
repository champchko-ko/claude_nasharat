"use client";

import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import type { MaintenanceStatus } from "@/lib/maintenance/types";

export function MaintenanceReasonForm({
  requestId,
  activeAction,
  isPending,
  onCancel,
  onSubmit,
}: {
  requestId: string;
  activeAction: MaintenanceStatus;
  isPending: boolean;
  onCancel: () => void;
  onSubmit: (formData: FormData) => void;
}) {
  const t = useTranslations("maintenance");
  const tCommon = useTranslations("common");

  return (
    <form action={onSubmit} className="space-y-3 rounded-md border border-border bg-muted/40 p-4">
      <input type="hidden" name="request_id" value={requestId} />
      <input type="hidden" name="target_status" value={activeAction} />

      <div className="space-y-1.5">
        <Label htmlFor="reason">
          {activeAction === "resolved"
            ? t("actions.evidenceUpload")
            : t("actions.reasonPlaceholder")}{" "}
          *
        </Label>
        <Input
          id="reason"
          name="reason"
          required={activeAction === "rejected" || activeAction === "reopened"}
          placeholder={t("actions.reasonPlaceholder")}
        />
      </div>

      {activeAction === "resolved" && (
        <div className="space-y-1.5">
          <Label htmlFor="evidence_photo">{t("evidencePhoto")}</Label>
          <Input
            id="evidence_photo"
            name="evidence_photo"
            type="file"
            accept="image/jpeg,image/png,image/webp"
          />
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="button" variant="ghost" size="sm" onClick={onCancel}>
          {tCommon("cancel")}
        </Button>
        <Button type="submit" size="sm" disabled={isPending}>
          {isPending ? tCommon("loading") : tCommon("save")}
        </Button>
      </div>
    </form>
  );
}
