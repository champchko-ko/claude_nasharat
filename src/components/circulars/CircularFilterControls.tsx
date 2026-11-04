"use client";

import { CircularStatusFilter } from "./CircularStatusFilter";
import { CircularPriorityFilter } from "./CircularPriorityFilter";
import { CircularDepartmentFilter } from "./CircularDepartmentFilter";
import { CircularSortSelect } from "./CircularSortSelect";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { CircularSortField } from "@/lib/circulars/sortCirculars";

export function CircularFilterControls({
  status,
  onStatusChange,
  priority,
  onPriorityChange,
  departmentId,
  onDepartmentChange,
  sortBy,
  onSortByChange,
  departments,
}: {
  status: string;
  onStatusChange: (v: string) => void;
  priority: string;
  onPriorityChange: (v: string) => void;
  departmentId: string;
  onDepartmentChange: (v: string) => void;
  sortBy: CircularSortField;
  onSortByChange: (v: CircularSortField) => void;
  departments: DepartmentRow[];
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <CircularStatusFilter status={status} onStatusChange={onStatusChange} />
      <CircularPriorityFilter priority={priority} onPriorityChange={onPriorityChange} />
      <CircularDepartmentFilter
        departmentId={departmentId}
        onDepartmentChange={onDepartmentChange}
        departments={departments}
      />
      <CircularSortSelect sortBy={sortBy} onSortByChange={onSortByChange} />
    </div>
  );
}
