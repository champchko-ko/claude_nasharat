import type { DepartmentRow } from "@/lib/school/getSchoolDepartments";
import { applyComplianceBucket } from "./applyComplianceBucket";
import { classifyTargetBucket } from "./classifyTargetBucket";
import { compliancePairKey } from "./compliancePairKey";
import { createComplianceCounts } from "./createComplianceCounts";
import type { ComplianceCounts, ComplianceDepartmentRef } from "./types";

export interface CircularAccumulation {
  counts: ComplianceCounts;
  responded: ComplianceDepartmentRef[];
  pending: ComplianceDepartmentRef[];
}

/**
 * Classifies every department targeted by one circular and folds the results
 * into that circular's counts, the department totals and the school totals.
 *
 * The department and school maps are mutated deliberately: one pass fills all
 * three views, which is what keeps them identical.
 */
export function accumulateCircularCompliance({
  circular,
  departmentIds,
  departmentById,
  statusByPair,
  departmentCounts,
  totals,
  now,
}: {
  circular: { id: string; due_at: string | null };
  departmentIds: string[];
  departmentById: Map<string, DepartmentRow>;
  statusByPair: Map<string, string>;
  departmentCounts: Map<string, ComplianceCounts>;
  totals: ComplianceCounts;
  now: Date;
}): CircularAccumulation {
  const counts = createComplianceCounts();
  const responded: ComplianceDepartmentRef[] = [];
  const pending: ComplianceDepartmentRef[] = [];

  for (const departmentId of departmentIds) {
    const department = departmentById.get(departmentId);
    if (!department) {
      continue;
    }
    const bucket = classifyTargetBucket({
      responseStatus: statusByPair.get(compliancePairKey(circular.id, departmentId)),
      dueAt: circular.due_at,
      now,
    });

    applyComplianceBucket(counts, bucket);
    applyComplianceBucket(departmentCounts.get(departmentId)!, bucket);
    applyComplianceBucket(totals, bucket);

    if (bucket === "notApplicable") {
      continue;
    }
    const reference = {
      id: departmentId,
      name: department.name_ar || department.name_en,
      outstanding: bucket === "compliant" ? 0 : 1,
    };
    if (bucket === "compliant") {
      responded.push(reference);
    } else {
      pending.push(reference);
    }
  }

  return { counts, responded, pending };
}
