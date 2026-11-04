import { filterAndSortCirculars } from "./filterAndSortCirculars";
import { filterAndSortMaintenance } from "./filterAndSortMaintenance";
import type {
  CircularsReportSummaryData,
  MaintenanceReportSummaryData,
  ReportFilterState,
} from "./types";

export function filterAndSortReportData(
  circularsData: CircularsReportSummaryData,
  maintenanceData: MaintenanceReportSummaryData,
  filters: ReportFilterState,
): {
  filteredCircularsData: CircularsReportSummaryData;
  filteredMaintenanceData: MaintenanceReportSummaryData;
} {
  return {
    filteredCircularsData: filterAndSortCirculars(circularsData, filters),
    filteredMaintenanceData: filterAndSortMaintenance(maintenanceData, filters),
  };
}
