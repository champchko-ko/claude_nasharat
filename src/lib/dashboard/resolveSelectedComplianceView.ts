import type { DashboardComplianceCircularItem, DashboardDepartmentComplianceSlice } from "./types";
import { resolveCircularSlices } from "./resolveCircularSlices";

export interface SelectedComplianceView {
  selectedCircular: DashboardComplianceCircularItem | null;
  displayedSlices: DashboardDepartmentComplianceSlice[];
}

export function resolveSelectedComplianceView(
  data: {
    departmentSlices: DashboardDepartmentComplianceSlice[];
    circulars: DashboardComplianceCircularItem[];
  },
  selectedCircularId: string,
): SelectedComplianceView {
  const selectedCircular =
    selectedCircularId === "all"
      ? null
      : (data.circulars.find((circular) => circular.id === selectedCircularId) ?? null);

  if (selectedCircular) {
    return {
      selectedCircular,
      displayedSlices: resolveCircularSlices(data.departmentSlices, selectedCircular),
    };
  }

  return { selectedCircular: null, displayedSlices: data.departmentSlices };
}
