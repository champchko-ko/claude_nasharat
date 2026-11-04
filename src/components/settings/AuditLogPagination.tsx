"use client";

import { useTranslations } from "next-intl";
import { usePathname, useRouter } from "@/i18n";
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildAuditFilterParams } from "@/lib/audit/buildAuditFilterParams";
import type { AuditLogFilters } from "@/lib/school/getSchoolAuditLogs";

export function AuditLogPagination({
  page,
  totalPages,
  totalCount,
  filters,
}: {
  page: number;
  totalPages: number;
  totalCount: number;
  filters?: AuditLogFilters;
}) {
  const t = useTranslations("settings");
  const router = useRouter();
  const pathname = usePathname();

  const navigateToPage = (newPage: number) => {
    const params = buildAuditFilterParams(filters);
    params.set("page", String(newPage));
    router.push(`${pathname}?${params.toString()}`);
  };

  if (totalPages <= 1) {
    return (
      <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
        <span>{t("auditTotalEntries", { count: totalCount })}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between px-2 text-xs text-muted-foreground">
      <span>{t("auditPageOf", { page, totalPages, totalCount })}</span>
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => navigateToPage(page - 1)}
          className="h-8 gap-1 text-xs"
        >
          <ChevronLeftIcon className="size-3.5 rtl:rotate-180" />
          <span>{t("auditPrevious")}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => navigateToPage(page + 1)}
          className="h-8 gap-1 text-xs"
        >
          <span>{t("auditNext")}</span>
          <ChevronRightIcon className="size-3.5 rtl:rotate-180" />
        </Button>
      </div>
    </div>
  );
}
