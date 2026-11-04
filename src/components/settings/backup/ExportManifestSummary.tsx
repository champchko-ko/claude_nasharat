"use client";

import { useTranslations } from "next-intl";
import type { BackupMetadata } from "@/lib/backup/types";

/**
 * What the file that was just downloaded contains, taken from its manifest.
 * Showing it after the export means the operator can quote the row count and
 * checksum without opening the JSON.
 */
export function ExportManifestSummary({ metadata }: { metadata: BackupMetadata }) {
  const t = useTranslations("backup");
  const tableCount = Object.values(metadata.tableCounts ?? {}).filter((count) => count > 0).length;

  return (
    <div className="mt-4 space-y-1.5 rounded-xl bg-muted/50 p-4 text-xs">
      <p className="font-medium text-foreground">{t("manifestTitle")}</p>
      <p className="text-muted-foreground">
        {t("rowsAcrossTables", { rows: metadata.totalRows ?? 0, tables: tableCount })}
      </p>
      {metadata.checksum ? (
        <p className="truncate font-mono text-[11px] text-muted-foreground">
          <span className="font-sans">{t("checksum")}: </span>
          {metadata.checksum.slice(0, 16)}…
        </p>
      ) : null}
    </div>
  );
}
