import { isRespondedStatus } from "@/lib/circulars/isRespondedStatus";

interface ResponseItem {
  circular_id: string;
  department_id: string;
  status: string;
}

/**
 * Groups the circular ids a department has actually responded to.
 *
 * The same construction is used by every compliance calculation so a
 * department can never be "responded" on one surface and "pending" on another.
 * Each circular id is stored in a Set, so duplicate response rows can never
 * inflate a department above its targeted count.
 */
export function indexRespondedCircularIdsByDepartment(
  responses: ResponseItem[],
): Map<string, Set<string>> {
  const byDepartment = new Map<string, Set<string>>();

  for (const response of responses) {
    if (!isRespondedStatus(response.status)) {
      continue;
    }
    const circularIds = byDepartment.get(response.department_id) ?? new Set<string>();
    circularIds.add(response.circular_id);
    byDepartment.set(response.department_id, circularIds);
  }

  return byDepartment;
}
