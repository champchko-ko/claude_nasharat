import { matchesCustomDateRange } from "./matchesCustomDateRange";
import type { ReportDateMode } from "./types";

export function matchesDateFilter(
  timestamp: string | null | undefined,
  dateMode: ReportDateMode,
  month: string,
  fromDate: string,
  toDate: string,
): boolean {
  if (dateMode === "month") {
    return !month || Boolean(timestamp?.startsWith(month));
  }
  if (dateMode === "custom") {
    return matchesCustomDateRange(timestamp, fromDate, toDate);
  }
  return true;
}
