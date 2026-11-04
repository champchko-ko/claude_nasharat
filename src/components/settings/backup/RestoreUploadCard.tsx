"use client";

import { useTranslations } from "next-intl";
import { UploadCloud } from "lucide-react";
import { RestoreConfirmDialog } from "./RestoreConfirmDialog";
import { useRestoreFile } from "./useRestoreFile";

export function RestoreUploadCard() {
  const t = useTranslations("backup");
  const {
    previewPayload,
    restoreDiff,
    isPreviewing,
    isDialogOpen,
    isRestoring,
    fileInputRef,
    handleFileChange,
    handleConfirmRestore,
    closeDialog,
  } = useRestoreFile();

  return (
    <>
      <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
        <div className="space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-warning/10 text-warning">
            <UploadCloud className="h-6 w-6" />
          </div>
          <div className="space-y-1.5">
            <h2 className="text-lg font-semibold text-foreground">{t("restoreCardTitle")}</h2>
            <p className="text-sm leading-relaxed text-muted-foreground">{t("restoreCardDesc")}</p>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileChange}
            className="hidden"
            id="backup-file-input"
          />
          <label
            htmlFor="backup-file-input"
            className="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-muted/30 px-4 py-3 text-sm font-medium text-foreground transition hover:border-primary hover:bg-muted/60 active:scale-95"
          >
            <UploadCloud className="h-4 w-4 text-primary" />
            <span>{t("selectFile")}</span>
          </label>
          <p className="mt-2 text-center text-[11px] text-muted-foreground">{t("maxFileSize")}</p>
        </div>
      </div>

      <RestoreConfirmDialog
        isOpen={isDialogOpen}
        isRestoring={isRestoring}
        isPreviewing={isPreviewing}
        payload={previewPayload}
        diff={restoreDiff}
        onClose={closeDialog}
        onConfirm={handleConfirmRestore}
      />
    </>
  );
}
