import type { CircularRow } from "./types";

export type CircularFilterOptions = {
  search?: string;
  status?: string;
  priority?: string;
  departmentId?: string;
};

export function filterCirculars(
  circulars: CircularRow[],
  filters: CircularFilterOptions,
): CircularRow[] {
  let result = circulars;

  const query = filters.search?.trim().toLowerCase();
  if (query) {
    result = result.filter(
      (item) =>
        item.title.toLowerCase().includes(query) || item.ref_number.toLowerCase().includes(query),
    );
  }

  if (filters.status && filters.status !== "all") {
    result = result.filter((item) => item.status === filters.status);
  }

  if (filters.priority && filters.priority !== "all") {
    result = result.filter((item) => item.priority === filters.priority);
  }

  if (filters.departmentId && filters.departmentId !== "all") {
    const deptId = filters.departmentId;
    result = result.filter((item) => item.targets?.some((t) => t.department_id === deptId));
  }

  return result;
}
