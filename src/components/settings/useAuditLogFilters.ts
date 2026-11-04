import { useState } from "react";
import { usePathname, useRouter } from "@/i18n";
import { buildAuditFilterParams } from "@/lib/audit/buildAuditFilterParams";
import type { AuditLogFilters } from "@/lib/school/getSchoolAuditLogs";

export function useAuditLogFilters(initialFilters?: AuditLogFilters) {
  const router = useRouter();
  const pathname = usePathname();
  const init = initialFilters || {};

  const [action, setAction] = useState(init.action || "");
  const [entityType, setEntityType] = useState(init.entityType || "");
  const [actorLabel, setActorLabel] = useState(init.actorLabel || "");
  const [startDate, setStartDate] = useState(init.startDate || "");
  const [endDate, setEndDate] = useState(init.endDate || "");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const params = buildAuditFilterParams({
      action: action.trim(),
      entityType: entityType.trim(),
      actorLabel: actorLabel.trim(),
      startDate,
      endDate,
    });
    params.set("page", "1");
    router.push(`${pathname}?${params.toString()}`);
  };

  const handleReset = () => {
    setAction("");
    setEntityType("");
    setActorLabel("");
    setStartDate("");
    setEndDate("");
    router.push(pathname);
  };

  return {
    action,
    setAction,
    entityType,
    setEntityType,
    actorLabel,
    setActorLabel,
    startDate,
    setStartDate,
    endDate,
    setEndDate,
    handleSearch,
    handleReset,
  };
}
