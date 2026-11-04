import type { CircularResponseRow } from "./types";
import type { DepartmentResponseStatus } from "./getCircularDepartmentStatuses";

export function buildResponseItems(
  responses: CircularResponseRow[],
  expectedDepartments: DepartmentResponseStatus[] = [],
): DepartmentResponseStatus[] {
  if (expectedDepartments.length > 0) {
    return expectedDepartments;
  }
  return responses.map((r) => ({
    departmentId: r.department_id,
    departmentName: r.department_name ?? "—",
    hasResponded: true,
    response: r,
  }));
}
