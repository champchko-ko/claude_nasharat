"use client";

import { useTranslations } from "next-intl";
import { Loader2, PlusCircle, RefreshCw, ShieldCheck } from "lucide-react";
import type { RestoreDiff } from "@/lib/backup";

/**
 * Shows what the restore would actually do, per category, before the operator
 * confirms. "Untouched" is included on purpose: restore is upsert-only, so the
 * rows the file does not mention survive, and the operator should see that.
 */
export function RestoreDiffSummary({
  diff,
  isPreviewing,
}: {
  diff: RestoreDiff | null;
  isPreviewing: boolean;
}) {
  const t = useTranslations("backup");

  if (isPreviewing) {
    return (
      <div className="mt-3 flex items-center gap-2 rounded-xl bg-muted/50 p-4 text-xs text-muted-foreground">
        <Loader2 className="h-3.5 w-3.5 animate-spin" />
        <span>{t("previewing")}</span>
      </div>
    );
  }

  if (!diff) return null;

  return (
    <div className="mt-3 space-y-2 rounded-xl bg-muted/50 p-4 text-xs">
      <div className="flex items-center justify-between border-b border-border/50 py-1">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <PlusCircle className="h-3.5 w-3.5 text-success" />
          {t("diffAdded")}
        </span>
        <span data-testid="restore-diff-added" className="font-semibold text-success">
          {diff.added}
        </span>{" "}
      </div>
      <div className="flex items-center justify-between border-b border-border/50 py-1">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <RefreshCw className="h-3.5 w-3.5 text-warning" />
          {t("diffOverwritten")}
        </span>
        <span data-testid="restore-diff-overwritten" className="font-semibold text-warning">
          {diff.overwritten}
        </span>
      </div>
      <div className="flex items-center justify-between border-b border-border/50 py-1">
        <span className="inline-flex items-center gap-1.5 text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
          {t("diffUntouched")}
        </span>
        <span data-testid="restore-diff-untouched" className="font-semibold text-foreground">
          {diff.untouched}
        </span>
      </div>
      <p className="pt-1 text-[11px] leading-relaxed text-muted-foreground">
        {t("restoreNeverDeletes")}
      </p>
    </div>
  );
}
