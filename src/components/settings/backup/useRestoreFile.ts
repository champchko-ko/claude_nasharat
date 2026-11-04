"use client";

import { useState, useRef } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n";
import { toast } from "sonner";
import { restoreBackupAction } from "@/actions/backup";
import { parseBackupFile } from "./parseBackupFile";
import { useRestorePreview } from "./useRestorePreview";
import type { DatabaseBackupPayload } from "@/lib/backup/types";

export function useRestoreFile() {
  const router = useRouter();
  const t = useTranslations("backup");
  const { diff, isPreviewing, preview, reset: resetPreview } = useRestorePreview();
  const [previewPayload, setPreviewPayload] = useState<DatabaseBackupPayload | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetInput = () => {
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const result = await parseBackupFile(file);
    if (!result.ok) {
      toast.error(t(result.reason === "too-large" ? "fileTooLarge" : "invalidFile"));
      resetInput();
      return;
    }

    setPreviewPayload(result.payload);
    setIsDialogOpen(true);
    await preview(result.payload);
  };

  const handleConfirmRestore = async () => {
    if (!previewPayload) return;
    try {
      setIsRestoring(true);
      const res = await restoreBackupAction(previewPayload);
      if (!res.success || !res.summary) {
        toast.error(res.error ?? t("restoreError"));
        return;
      }

      const message = res.summary.snapshotId
        ? t("restoreSuccessWithSnapshot", {
            count: res.summary.totalRecords,
            tables: Object.keys(res.summary.tableCounts).length,
            id: res.summary.snapshotId,
          })
        : t("restoreSuccess", {
            count: res.summary.totalRecords,
            tables: Object.keys(res.summary.tableCounts).length,
          });
      toast.success(message);
      closeDialog();
      router.refresh();
    } catch {
      toast.error(t("restoreError"));
    } finally {
      setIsRestoring(false);
    }
  };

  const closeDialog = () => {
    setIsDialogOpen(false);
    setPreviewPayload(null);
    resetPreview();
    resetInput();
  };

  return {
    previewPayload,
    restoreDiff: diff,
    isPreviewing,
    isDialogOpen,
    isRestoring,
    fileInputRef,
    handleFileChange,
    handleConfirmRestore,
    closeDialog,
  };
}
