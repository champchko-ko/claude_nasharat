import type { DepartmentResponseStatus } from "./getCircularDepartmentStatuses";

export interface ResponseFilterCounts {
  respondedCount: number;
  acknowledgedCount: number;
  rejectedCount: number;
  pendingCount: number;
}

export function computeResponseFilterCounts(
  items: DepartmentResponseStatus[],
): ResponseFilterCounts {
  let respondedCount = 0;
  let acknowledgedCount = 0;
  let rejectedCount = 0;
  let pendingCount = 0;

  for (const item of items) {
    const status = item.response?.status;
    if (status === "approved" || status === "completed") {
      respondedCount += 1;
    } else if (status === "acknowledged") {
      acknowledgedCount += 1;
    } else if (status === "rejected") {
      rejectedCount += 1;
    } else {
      pendingCount += 1;
    }
  }

  return { respondedCount, acknowledgedCount, rejectedCount, pendingCount };
}
