import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import { accumulateCircularCompliance } from "./accumulateCircularCompliance";
import { buildCircularDepartmentIds } from "./buildCircularDepartmentIds";
import { createComplianceCounts } from "./createComplianceCounts";
import { indexResponseStatusByPair } from "./indexResponseStatusByPair";
import { isDeliveredStatus } from "./isDeliveredStatus";
import { toCompliancePercent } from "./toCompliancePercent";
import type {
  CircularReportRow,
  ComplianceCounts,
  ComplianceDepartmentRef,
  DepartmentComplianceItem,
} from "./types";

export interface ComplianceCircularInput {
  id: string;
  ref_number: string;
  title: string;
  category: string;
  priority: string;
  status: string;
  publish_at: string | null;
  due_at: string | null;
}

export interface ComplianceTargetInput {
  circular_id: string;
  department_id: string | null;
}

export interface ComplianceResponseInput {
  circular_id: string;
  department_id: string;
  status: string;
}

export interface CalculatedCompliance {
  departments: DepartmentComplianceItem[];
  circulars: CircularReportRow[];
  totals: ComplianceCounts;
}

/**
 * The one compliance calculation.
 *
 * Builds the target map once (no filtering inside nested loops), classifies each
 * (circular, department) pair into compliant / overdue / not yet due / not
 * applicable, and returns per-department, per-circular and overall counts from
 * the same pass. The dashboard, the reports page and both CSV exports read these
 * results, so they cannot disagree.
 */
export function calculateCompliance({
  circulars,
  targets,
  responses,
  departments,
  now = new Date(),
}: {
  circulars: ComplianceCircularInput[];
  targets: ComplianceTargetInput[];
  responses: ComplianceResponseInput[];
  departments: DepartmentRow[];
  now?: Date;
}): CalculatedCompliance {
  const delivered = circulars.filter((circular) => isDeliveredStatus(circular.status));
  const departmentById = new Map(departments.map((department) => [department.id, department]));
  const departmentIdsByCircular = buildCircularDepartmentIds({
    departments,
    targets,
    circularIds: delivered.map((circular) => circular.id),
  });
  const statusByPair = indexResponseStatusByPair(responses);

  const departmentCounts = new Map(departments.map((d) => [d.id, createComplianceCounts()]));
  const circularCounts = new Map<string, ComplianceCounts>();
  const respondedByCircular = new Map<string, ComplianceDepartmentRef[]>();
  const pendingByCircular = new Map<string, ComplianceDepartmentRef[]>();
  const totals = createComplianceCounts();

  for (const circular of delivered) {
    const accumulation = accumulateCircularCompliance({
      circular,
      departmentIds: departmentIdsByCircular.get(circular.id) ?? [],
      departmentById,
      statusByPair,
      departmentCounts,
      totals,
      now,
    });
    circularCounts.set(circular.id, accumulation.counts);
    respondedByCircular.set(circular.id, accumulation.responded);
    pendingByCircular.set(circular.id, accumulation.pending);
  }

  return {
    departments: departments.map((department) => {
      const counts = departmentCounts.get(department.id)!;
      return {
        departmentId: department.id,
        departmentName: department.name_ar || department.name_en,
        ...counts,
        percent: toCompliancePercent(counts),
      };
    }),
    circulars: delivered.map((circular) => {
      const counts = circularCounts.get(circular.id)!;
      return {
        id: circular.id,
        refNumber: circular.ref_number,
        title: circular.title,
        category: circular.category,
        priority: circular.priority,
        status: circular.status,
        publishAt: circular.publish_at,
        dueAt: circular.due_at,
        ...counts,
        percent: toCompliancePercent(counts),
        respondedDepartments: respondedByCircular.get(circular.id) ?? [],
        pendingDepartments: pendingByCircular.get(circular.id) ?? [],
      };
    }),
    totals: { ...totals, percent: toCompliancePercent(totals) },
  };
}
