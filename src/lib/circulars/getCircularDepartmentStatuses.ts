import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type { CircularDetail } from "./getCircularById";
import type { CircularResponseRow } from "./types";

export interface DepartmentResponseStatus {
  departmentId: string;
  departmentName: string;
  hasResponded: boolean;
  response?: CircularResponseRow;
}

export function getCircularDepartmentStatuses(
  circular: CircularDetail,
  allDepartments: DepartmentRow[],
  responses: CircularResponseRow[],
): DepartmentResponseStatus[] {
  const specificTargetIds = circular.targets
    .map((t) => t.department_id)
    .filter((id): id is string => Boolean(id));

  const targetedDepts =
    specificTargetIds.length > 0
      ? allDepartments.filter((d) => specificTargetIds.includes(d.id))
      : allDepartments.filter((d) => d.is_active);

  return targetedDepts.map((dept) => {
    const existing = responses.find((r) => r.department_id === dept.id);
    return {
      departmentId: dept.id,
      departmentName: dept.name_ar || dept.name_en,
      hasResponded: Boolean(existing),
      response: existing,
    };
  });
}
