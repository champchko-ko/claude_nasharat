import type { ReportFilterParams } from "./types";

export type ReportFilterQuery<T> = {
  eq: (column: string, value: unknown) => T;
  gte: (column: string, value: unknown) => T;
  lte: (column: string, value: unknown) => T;
};

export function applyCircularReportFilters<T extends ReportFilterQuery<T>>(
  query: T,
  filters: ReportFilterParams,
): T {
  let q = query;
  if (filters.status) q = q.eq("status", filters.status);
  if (filters.category) q = q.eq("category", filters.category);
  if (filters.from) q = q.gte("created_at", filters.from);
  if (filters.to) q = q.lte("created_at", `${filters.to}T23:59:59.999Z`);
  return q;
}
