import { render, screen, cleanup } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { DashboardComplianceWidget } from "./DashboardComplianceWidget";
import type { DashboardComplianceData } from "@/lib/dashboard/types";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => {
    const map: Record<string, string> = {
      circularCompliance: "Department Circular Compliance",
      circularComplianceDesc: "Response rates and pending acknowledgments",
      overallCompliance: "Overall Compliance",
      selectCircular: "Select Circular",
      allCircularsSummary: "All Circulars (Overall)",
      showingRecentCirculars: "showing recent circulars",
      respondedDepartments: "Responded Departments",
      pendingDepartments: "Pending Departments",
      complianceByDepartment: "Compliance by department",
      complianceTarget: "Target 80%",
      sortedByLowestCompliance: "Lowest compliance first",
      legendCompliant: "Compliant",
      legendOverdue: "Overdue",
      legendNotYetDue: "Not yet due",
      compliantOfTargeted: "compliant of targeted",
      outstandingOfTargeted: "outstanding of targeted",
      showAllDepartments: "Show all departments",
      showLowestDepartments: "Show lowest departments",
      noComplianceData: "No circular response data available yet",
      allResponded: "All departments responded",
    };
    return map[key] ?? key;
  },
  useLocale: () => "en",
}));

vi.mock("@/components/circulars/CircularRemindButton", () => ({
  CircularRemindButton: () => <button data-testid="remind-button">Urge Pending</button>,
}));

describe("DashboardComplianceWidget", () => {
  afterEach(() => {
    cleanup();
  });

  const mockData: DashboardComplianceData = {
    totals: { targeted: 5, compliant: 3, overdue: 1, notYetDue: 1, notApplicable: 0, percent: 60 },
    departmentSlices: [
      {
        id: "dept-1",
        name: "Science",
        targeted: 2,
        compliant: 2,
        overdue: 0,
        notYetDue: 0,
        percent: 100,
      },
      {
        id: "dept-2",
        name: "Math",
        targeted: 2,
        compliant: 1,
        overdue: 1,
        notYetDue: 0,
        percent: 50,
      },
      {
        id: "dept-3",
        name: "Arabic",
        targeted: 1,
        compliant: 0,
        overdue: 0,
        notYetDue: 1,
        percent: 0,
      },
    ],
    circulars: [
      {
        id: "c-1",
        refNumber: "CIRC-001",
        title: "Midterm Protocol",
        status: "published",
        dueAt: null,
        targeted: 2,
        compliant: 1,
        overdue: 1,
        notYetDue: 0,
        notApplicable: 0,
        percent: 50,
        respondedDepartments: [{ id: "dept-1", name: "Science", outstanding: 0 }],
        pendingDepartments: [{ id: "dept-2", name: "Math", outstanding: 1 }],
      },
    ],
    circularCount: 1,
  };

  it("shows the selected circular's rate and its own rows", () => {
    render(<DashboardComplianceWidget data={mockData} />);

    expect(screen.getByText("CIRC-001")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "50");
    expect(screen.getAllByText("50%").length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText("1/1 · 100%")).toBeInTheDocument();
    expect(screen.getByText("0/1 · 0%")).toBeInTheDocument();
    expect(screen.getByTestId("remind-button")).toBeInTheDocument();
  });

  it("shows the overall rate and one row per targeted department", () => {
    render(<DashboardComplianceWidget data={{ ...mockData, circulars: [], circularCount: 0 }} />);

    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "60");
    expect(screen.getByText("Overall Compliance")).toBeInTheDocument();
    expect(screen.getByText("2/2 · 100%")).toBeInTheDocument();
    expect(screen.getByText("1/2 · 50%")).toBeInTheDocument();
    expect(screen.getByText("0/1 · 0%")).toBeInTheDocument();
  });

  it("never renders a row for a department with nothing to respond to", () => {
    render(
      <DashboardComplianceWidget
        data={{
          ...mockData,
          circulars: [],
          circularCount: 0,
          departmentSlices: [
            ...mockData.departmentSlices,
            {
              id: "dept-4",
              name: "Library",
              targeted: 0,
              compliant: 0,
              overdue: 0,
              notYetDue: 0,
              percent: null,
            },
          ],
        }}
      />,
    );

    expect(screen.queryByText("Library")).not.toBeInTheDocument();
    expect(screen.getByText("2/2 · 100%")).toBeInTheDocument();
  });

  it("says how many circulars the selector is hiding", () => {
    render(<DashboardComplianceWidget data={{ ...mockData, circularCount: 12 }} />);

    expect(screen.getByRole("combobox")).toBeInTheDocument();
    expect(screen.getByText("showing recent circulars")).toBeInTheDocument();
  });

  it("does not offer a reminder for a circular that is not published", () => {
    render(
      <DashboardComplianceWidget
        data={{
          ...mockData,
          circulars: [{ ...mockData.circulars[0]!, status: "completed" }],
        }}
      />,
    );

    expect(screen.queryByTestId("remind-button")).not.toBeInTheDocument();
  });

  it("reports no compliance instead of 100% when nothing is targeted", () => {
    render(
      <DashboardComplianceWidget
        data={{
          totals: {
            targeted: 0,
            compliant: 0,
            overdue: 0,
            notYetDue: 0,
            notApplicable: 0,
            percent: null,
          },
          departmentSlices: [],
          circulars: [],
          circularCount: 0,
        }}
      />,
    );

    expect(screen.queryByText("100%")).not.toBeInTheDocument();
    expect(screen.getAllByText("—").length).toBeGreaterThan(0);
    expect(screen.getByText("No circular response data available yet")).toBeInTheDocument();
    expect(screen.getByRole("progressbar")).toHaveAttribute("aria-valuenow", "0");
    expect(screen.queryByTestId("remind-button")).not.toBeInTheDocument();
  });
});
