"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import { toast } from "sonner";
import { chipClass } from "@/components/ui/segment-styles";
import { buildReportExportParams } from "@/lib/reports/buildReportExportParams";
import type { ReportFilterState } from "@/lib/reports/types";

export function ExportCsvButton({
  type,
  filters,
}: {
  type: "circulars" | "maintenance";
  filters?: Partial<ReportFilterState>;
}) {
  const t = useTranslations("reports");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = buildReportExportParams(type, filters);
      const res = await fetch(`/api/reports/export?${params.toString()}`);
      if (!res.ok) {
        throw new Error("Export failed");
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${type}-report-${Date.now()}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success(t("exportCsv"));
    } catch {
      toast.error(t("exportCsv"));
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleExport}
      disabled={isExporting}
      className={`${chipClass(false)} gap-2 text-xs disabled:pointer-events-none disabled:opacity-50`}
    >
      {isExporting ? (
        <Loader2Icon className="size-3.5 animate-spin" />
      ) : (
        <DownloadIcon className="size-3.5" />
      )}
      <span>{isExporting ? t("exporting") : t("exportCsv")}</span>
    </button>
  );
}
