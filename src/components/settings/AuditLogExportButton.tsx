"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { DownloadIcon, Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildAuditFilterParams } from "@/lib/audit/buildAuditFilterParams";
import type { AuditLogFilters } from "@/lib/school/getSchoolAuditLogs";

export function AuditLogExportButton({ filters }: { filters?: AuditLogFilters }) {
  const t = useTranslations("common");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    const params = buildAuditFilterParams(filters);

    const a = document.createElement("a");
    a.href = `/api/audit/export?${params.toString()}`;
    a.setAttribute("download", "");
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    setTimeout(() => setIsExporting(false), 2000);
  };

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      onClick={handleExport}
      disabled={isExporting}
      className="gap-2"
    >
      {isExporting ? (
        <Loader2Icon className="size-4 animate-spin" />
      ) : (
        <DownloadIcon className="size-4" />
      )}
      <span>{isExporting ? t("loading") : "Export CSV"}</span>
    </Button>
  );
}
