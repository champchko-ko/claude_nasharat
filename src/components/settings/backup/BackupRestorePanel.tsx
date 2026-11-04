"use client";

import { useTranslations } from "next-intl";
import { ShieldCheck } from "lucide-react";
import { BackupExportCard } from "./BackupExportCard";
import { RestoreUploadCard } from "./RestoreUploadCard";

export function BackupRestorePanel() {
  const t = useTranslations("backup");

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2.5 rounded-2xl border border-primary/20 bg-primary/5 p-4 text-xs text-muted-foreground">
        <ShieldCheck className="h-5 w-5 shrink-0 text-primary" />
        <span>{t("onlyOwnerAndManager")}</span>
      </div>

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <BackupExportCard />
        <RestoreUploadCard />
      </div>
    </div>
  );
}
