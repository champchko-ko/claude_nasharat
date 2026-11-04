"use client";

import { useTranslations } from "next-intl";
import type { DatabaseBackupPayload } from "@/lib/backup";

export function RestoreMetadataSummary({ payload }: { payload: DatabaseBackupPayload }) {
  const t = useTranslations("backup");
  const tableEntries = Object.entries(payload.tables).filter(
    ([, rows]) => Array.isArray(rows) && rows.length > 0,
  );
  const totalCount = tableEntries.reduce((acc, [, rows]) => acc + (rows?.length ?? 0), 0);
  const checksum = payload.metadata.checksum;

  return (
    <div className="space-y-2 rounded-xl bg-muted/50 p-4 text-xs">
      <div className="flex justify-between border-b border-border/50 py-1">
        <span className="text-muted-foreground">{t("exportedAt")}:</span>
        <span className="font-medium">
          {new Date(payload.metadata.exportedAt).toLocaleString()}
        </span>
      </div>
      <div className="flex justify-between border-b border-border/50 py-1">
        <span className="text-muted-foreground">{t("scope")}:</span>
        <span className="font-medium">
          {payload.metadata.scope === "platform" ? t("platformScope") : t("schoolScope")}
        </span>
      </div>
      <div className="flex justify-between border-b border-border/50 py-1">
        <span className="text-muted-foreground">{t("totalRecords")}:</span>
        <span className="font-semibold text-primary">{totalCount}</span>
      </div>
      {checksum ? (
        <div className="flex justify-between gap-3 border-b border-border/50 py-1">
          <span className="shrink-0 text-muted-foreground">{t("checksum")}:</span>
          <span className="truncate font-mono text-[11px]" title={checksum}>
            {checksum.slice(0, 16)}…
          </span>
        </div>
      ) : null}
      <div className="pt-2">
        <span className="mb-1.5 block font-medium text-muted-foreground">
          {t("tablesIncluded")}:
        </span>
        <div className="flex max-h-32 flex-wrap gap-1.5 overflow-y-auto">
          {tableEntries.map(([tbl, rows]) => (
            <span
              key={tbl}
              className="inline-flex items-center gap-1 rounded-md border border-border bg-background px-2 py-0.5 font-mono text-[11px]"
            >
              <span>{tbl}</span>
              <span className="font-sans text-muted-foreground">({rows?.length})</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
