import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";

interface TargetItem {
  circular_id: string;
  department_id: string | null;
}

/**
 * The departments each delivered circular targets.
 *
 * A circular with explicit target rows targets exactly those (dropping ids that
 * no longer exist); a circular with none targets every active department. Both
 * the per-department and per-circular views read this map, so they cannot
 * disagree about who was asked to respond.
 */
export function buildCircularDepartmentIds({
  departments,
  targets,
  circularIds,
}: {
  departments: DepartmentRow[];
  targets: TargetItem[];
  circularIds: string[];
}): Map<string, string[]> {
  const specificIds = new Map<string, Set<string>>();
  for (const target of targets) {
    if (!target.department_id) {
      continue;
    }
    const ids = specificIds.get(target.circular_id) ?? new Set<string>();
    ids.add(target.department_id);
    specificIds.set(target.circular_id, ids);
  }

  const knownIds = new Set(departments.map((department) => department.id));
  const activeIds = departments
    .filter((department) => department.is_active)
    .map((department) => department.id);

  const recipients = new Map<string, string[]>();
  for (const circularId of circularIds) {
    const explicit = specificIds.get(circularId);
    const ids =
      explicit && explicit.size > 0
        ? [...explicit].filter((departmentId) => knownIds.has(departmentId))
        : activeIds;
    recipients.set(circularId, ids);
  }

  return recipients;
}
