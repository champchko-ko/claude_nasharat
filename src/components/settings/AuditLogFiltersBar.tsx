"use client";

import { useTranslations } from "next-intl";
import { SearchIcon, RotateCcwIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { AuditLogDateInputs } from "./AuditLogDateInputs";
import { useAuditLogFilters } from "./useAuditLogFilters";
import type { AuditLogFilters } from "@/lib/school/getSchoolAuditLogs";

export function AuditLogFiltersBar({ initialFilters }: { initialFilters?: AuditLogFilters }) {
  const t = useTranslations("common");
  const tSettings = useTranslations("settings");
  const form = useAuditLogFilters(initialFilters);

  return (
    <form
      onSubmit={form.handleSearch}
      className="flex flex-wrap items-center gap-3 rounded-lg border border-border bg-card p-4"
    >
      <div className="flex min-w-40 flex-1 flex-col gap-1">
        <Input
          placeholder={tSettings("auditFilterAction")}
          value={form.action}
          onChange={(e) => form.setAction(e.target.value)}
          className="h-9 text-xs"
        />
      </div>

      <div className="flex min-w-36 flex-1 flex-col gap-1">
        <Input
          placeholder={tSettings("auditFilterEntity")}
          value={form.entityType}
          onChange={(e) => form.setEntityType(e.target.value)}
          className="h-9 text-xs"
        />
      </div>

      <div className="flex min-w-36 flex-1 flex-col gap-1">
        <Input
          placeholder={tSettings("auditFilterActor")}
          value={form.actorLabel}
          onChange={(e) => form.setActorLabel(e.target.value)}
          className="h-9 text-xs"
        />
      </div>

      <AuditLogDateInputs
        startDate={form.startDate}
        endDate={form.endDate}
        onStartDateChange={form.setStartDate}
        onEndDateChange={form.setEndDate}
      />

      <div className="flex items-center gap-2">
        <Button type="submit" size="sm" className="h-9 gap-1.5 text-xs">
          <SearchIcon className="size-3.5" />
          <span>{t("search")}</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={form.handleReset}
          className="h-9 gap-1.5 text-xs"
        >
          <RotateCcwIcon className="size-3.5" />
          <span>{t("reset")}</span>
        </Button>
      </div>
    </form>
  );
}
