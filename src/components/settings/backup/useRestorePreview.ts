"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { previewRestoreAction } from "@/actions/backup";
import type { DatabaseBackupPayload, RestoreDiff } from "@/lib/backup/types";

/**
 * Asks the server what the file would change, without writing anything.
 * Kept separate from the file picker so the picker stays about reading a file
 * and this hook stays about the preview request.
 */
export function useRestorePreview() {
  const t = useTranslations("backup");
  const [diff, setDiff] = useState<RestoreDiff | null>(null);
  const [isPreviewing, setIsPreviewing] = useState(false);

  const preview = async (payload: DatabaseBackupPayload) => {
    setIsPreviewing(true);
    setDiff(null);
    try {
      const res = await previewRestoreAction(payload);
      if (!res.success || !res.diff) {
        toast.error(res.error ?? t("previewFailed"));
        return;
      }
      setDiff(res.diff);
    } catch {
      toast.error(t("previewFailed"));
    } finally {
      setIsPreviewing(false);
    }
  };

  const reset = () => {
    setDiff(null);
    setIsPreviewing(false);
  };

  return { diff, isPreviewing, preview, reset };
}
