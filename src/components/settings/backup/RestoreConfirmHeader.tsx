"use client";

import { useTranslations } from "next-intl";
import { AlertTriangle, Database, X } from "lucide-react";
import type { DatabaseBackupPayload } from "@/lib/backup";

export function RestoreConfirmHeader({
  payload,
  isRestoring,
  onClose,
}: {
  payload: DatabaseBackupPayload;
  isRestoring: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("backup");

  return (
    <>
      <div className="flex items-center justify-between border-b border-border pb-4">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-warning/15 text-warning">
            <Database className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-semibold">{t("confirmTitle")}</h2>
            <p className="text-xs text-muted-foreground">
              {payload.metadata.schoolName ?? payload.metadata.scope}
            </p>
          </div>
        </div>
        <button
          type="button"
          disabled={isRestoring}
          onClick={onClose}
          className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="my-4 flex items-start gap-3 rounded-xl bg-warning/10 p-3 text-xs text-warning">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <span>{t("confirmWarning")}</span>
      </div>
    </>
  );
}
