import type { ResponseFilterTab } from "@/components/circulars/CircularResponseFilterBar";
import type { DepartmentResponseStatus } from "./getCircularDepartmentStatuses";

export function filterCircularResponseItems(
  items: DepartmentResponseStatus[],
  filter: ResponseFilterTab,
): DepartmentResponseStatus[] {
  if (filter === "all") return items;

  return items.filter((i) => {
    const status = i.response?.status;
    switch (filter) {
      case "responded":
        return status === "approved" || status === "completed";
      case "acknowledged":
        return status === "acknowledged";
      case "rejected":
        return status === "rejected";
      case "pending":
        return !i.hasResponded || status === "pending";
      default:
        return true;
    }
  });
}
