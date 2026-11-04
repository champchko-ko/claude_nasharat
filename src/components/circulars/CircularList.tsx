"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { CircularFilters } from "./CircularFilters";
import { CircularTable } from "./CircularTable";
import { filterCirculars } from "@/lib/circulars/filterCirculars";
import { sortCirculars, type CircularSortField } from "@/lib/circulars/sortCirculars";
import type { CircularRow } from "@/lib/circulars/types";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

export function CircularList({
  circulars,
  departments = [],
  canManage = false,
}: {
  circulars: CircularRow[];
  departments?: DepartmentRow[];
  canManage?: boolean;
}) {
  const t = useTranslations("circulars");
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("all");
  const [priority, setPriority] = useState("all");
  const [departmentId, setDepartmentId] = useState("all");
  const [sortBy, setSortBy] = useState<CircularSortField>("publish_at_desc");

  const filteredAndSorted = useMemo(() => {
    const filtered = filterCirculars(circulars, { search, status, priority, departmentId });
    return sortCirculars(filtered, sortBy);
  }, [circulars, search, status, priority, departmentId, sortBy]);

  return (
    <div className="space-y-4">
      <CircularFilters
        search={search}
        onSearchChange={setSearch}
        status={status}
        onStatusChange={setStatus}
        priority={priority}
        onPriorityChange={setPriority}
        departmentId={departmentId}
        onDepartmentChange={setDepartmentId}
        sortBy={sortBy}
        onSortByChange={setSortBy}
        departments={departments}
      />

      {filteredAndSorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-[color:var(--panel,var(--card))] p-12 text-center text-muted-foreground">
          {circulars.length === 0 ? t("noCirculars") : t("noMatchingCirculars")}
        </div>
      ) : (
        <CircularTable
          circulars={filteredAndSorted}
          canManage={canManage}
          totalDepartments={departments.length}
        />
      )}
    </div>
  );
}
