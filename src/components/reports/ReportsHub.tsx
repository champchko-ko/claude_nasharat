"use client";

import { useState, useMemo } from "react";
import { useTranslations } from "next-intl";
import { SEGMENT_GROUP, segmentClass } from "@/components/ui/segment-styles";
import { ExportCsvButton } from "./ExportCsvButton";
import { ReportFiltersBar } from "./ReportFiltersBar";
import { CircularsReportSummary } from "./CircularsReportSummary";
import { DepartmentComplianceTable } from "./DepartmentComplianceTable";
import { CircularsReportTable } from "./CircularsReportTable";
import { MaintenanceReportSummary } from "./MaintenanceReportSummary";
import { MaintenanceReportTable } from "./MaintenanceReportTable";
import { filterAndSortReportData } from "@/lib/reports/filterAndSortReportData";
import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import type {
  CircularsReportSummaryData,
  MaintenanceReportSummaryData,
  ReportFilterState,
} from "@/lib/reports/types";

const INITIAL_FILTERS: ReportFilterState = {
  dateMode: "all",
  month: "",
  fromDate: "",
  toDate: "",
  dateSort: "desc",
  departmentId: "all",
  departmentSort: "none",
};

export function ReportsHub({
  circularsData,
  maintenanceData,
  departments = [],
}: {
  circularsData: CircularsReportSummaryData;
  maintenanceData: MaintenanceReportSummaryData;
  departments?: DepartmentRow[];
}) {
  const t = useTranslations("reports");
  const [activeTab, setActiveTab] = useState<"circulars" | "maintenance">("circulars");
  const [filters, setFilters] = useState<ReportFilterState>(INITIAL_FILTERS);

  const handleFilterChange = (updates: Partial<ReportFilterState>) => {
    setFilters((prev) => ({ ...prev, ...updates }));
  };

  const handleReset = () => {
    setFilters(INITIAL_FILTERS);
  };

  const { filteredCircularsData, filteredMaintenanceData } = useMemo(
    () => filterAndSortReportData(circularsData, maintenanceData, filters),
    [circularsData, maintenanceData, filters],
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 border-b border-border pb-4 sm:flex-row sm:items-center sm:justify-between">
        <div className={SEGMENT_GROUP} role="group">
          <button
            type="button"
            aria-pressed={activeTab === "circulars"}
            onClick={() => setActiveTab("circulars")}
            className={segmentClass(activeTab === "circulars")}
          >
            {t("circularsTab")}
          </button>
          <button
            type="button"
            aria-pressed={activeTab === "maintenance"}
            onClick={() => setActiveTab("maintenance")}
            className={segmentClass(activeTab === "maintenance")}
          >
            {t("maintenanceTab")}
          </button>
        </div>
        <ExportCsvButton type={activeTab} filters={filters} />
      </div>

      <ReportFiltersBar
        filters={filters}
        onFilterChange={handleFilterChange}
        onReset={handleReset}
        departments={departments}
      />

      {activeTab === "circulars" ? (
        <div className="space-y-6">
          <CircularsReportSummary data={filteredCircularsData} />
          <DepartmentComplianceTable items={filteredCircularsData.departmentBreakdown} />
          <CircularsReportTable rows={filteredCircularsData.rows} />
        </div>
      ) : (
        <div className="space-y-6">
          <MaintenanceReportSummary data={filteredMaintenanceData} />
          <MaintenanceReportTable rows={filteredMaintenanceData.rows} />
        </div>
      )}
    </div>
  );
}
