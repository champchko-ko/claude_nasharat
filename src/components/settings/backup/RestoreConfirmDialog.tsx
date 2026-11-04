"use client";

import { useTranslations } from "next-intl";
import { InfoIcon, Loader2 } from "lucide-react";
import { useDrawerEscape } from "@/components/layout/useDrawerEscape";
import { RestoreConfirmHeader } from "./RestoreConfirmHeader";
import { RestoreMetadataSummary } from "./RestoreMetadataSummary";
import { RestoreDiffSummary } from "./RestoreDiffSummary";
import type { DatabaseBackupPayload, RestoreDiff } from "@/lib/backup";

export function RestoreConfirmDialog({
  isOpen,
  isRestoring,
  isPreviewing,
  payload,
  diff,
  onClose,
  onConfirm,
}: {
  isOpen: boolean;
  isRestoring: boolean;
  isPreviewing: boolean;
  payload: DatabaseBackupPayload | null;
  diff: RestoreDiff | null;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const t = useTranslations("backup");

  useDrawerEscape(onClose, isOpen && Boolean(payload));

  if (!isOpen || !payload) return null;

  const busy = isRestoring || isPreviewing;

  return (
    <div
      role="dialog"
      aria-modal="true"
      data-testid="restore-confirm-dialog"
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-scrim/60 p-4 backdrop-blur-sm duration-200 fade-in"
      onClick={onClose}
    >
      <div
        className="relative max-h-[90vh] w-full max-w-lg animate-in overflow-y-auto rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl duration-200 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <RestoreConfirmHeader payload={payload} isRestoring={busy} onClose={onClose} />

        <RestoreMetadataSummary payload={payload} />
        <RestoreDiffSummary diff={diff} isPreviewing={isPreviewing} />

        <p className="mt-3 flex items-start gap-2 rounded-xl bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
          <InfoIcon className="mt-0.5 h-3.5 w-3.5 shrink-0" />
          <span>{t("notDisasterRecovery")}</span>
        </p>

        <div className="mt-6 flex items-center justify-end gap-3 border-t border-border pt-4">
          <button
            type="button"
            disabled={isRestoring}
            onClick={onClose}
            className="rounded-xl border border-border px-4 py-2 text-xs font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground disabled:opacity-50"
          >
            {t("cancel")}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow transition hover:opacity-90 active:scale-95 disabled:opacity-50"
          >
            {isRestoring ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>{t("restoring")}</span>
              </>
            ) : (
              <span>{t("restoreButton")}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
