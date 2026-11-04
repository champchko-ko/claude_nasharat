"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { Database, Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { exportBackupAction } from "@/actions/backup";
import { ExportManifestSummary } from "./ExportManifestSummary";
import type { BackupMetadata } from "@/lib/backup/types";

export function BackupExportCard() {
  const [isExporting, setIsExporting] = useState(false);
  const [lastManifest, setLastManifest] = useState<BackupMetadata | null>(null);
  const t = useTranslations("backup");
  const tCommon = useTranslations("common");

  const handleExport = async () => {
    try {
      setIsExporting(true);
      const res = await exportBackupAction();

      if (!res.success || !res.backup) {
        toast.error(res.error ?? tCommon("error"));
        return;
      }

      const jsonString = JSON.stringify(res.backup, null, 2);
      const url = URL.createObjectURL(new Blob([jsonString], { type: "application/json" }));
      const a = document.createElement("a");
      const dateStr = new Date().toISOString().slice(0, 10);
      const scopeStr = res.backup.metadata.schoolId ? "school" : "platform";

      a.href = url;
      a.download = `backup-${scopeStr}-${dateStr}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setLastManifest(res.backup.metadata);
      toast.success(t("exportSuccess"));
    } catch {
      toast.error(tCommon("error"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="space-y-4">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
          <Database className="h-6 w-6" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-lg font-semibold text-foreground">{t("exportCardTitle")}</h2>
          <p className="text-sm leading-relaxed text-muted-foreground">{t("exportCardDesc")}</p>
        </div>
      </div>

      {lastManifest ? <ExportManifestSummary metadata={lastManifest} /> : null}

      <div className="mt-8 border-t border-border pt-4">
        <button
          type="button"
          disabled={isExporting}
          onClick={handleExport}
          className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition hover:opacity-90 active:scale-95 disabled:opacity-50"
        >
          {isExporting ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>{t("exporting")}</span>
            </>
          ) : (
            <>
              <Download className="h-4 w-4" />
              <span>{t("exportButton")}</span>
            </>
          )}
        </button>
        <p className="mt-2 text-center text-[11px] leading-relaxed text-muted-foreground">
          {t("notDisasterRecovery")}
        </p>
      </div>
    </div>
  );
}
