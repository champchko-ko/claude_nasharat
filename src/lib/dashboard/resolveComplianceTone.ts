import { COMPLIANCE_THRESHOLDS } from "./complianceThresholds";

export interface ComplianceTone {
  fillClass: string;
  strokeClass: string;
  textClass: string;
}

/**
 * Shared colour thresholds for compliance values (80% good, 50% warning),
 * matching the reports module so the same value always reads the same way.
 */
export function resolveComplianceTone(percent: number): ComplianceTone {
  if (percent >= COMPLIANCE_THRESHOLDS.good) {
    return {
      fillClass: "bg-success",
      strokeClass: "stroke-success",
      textClass: "text-success",
    };
  }
  if (percent >= COMPLIANCE_THRESHOLDS.warning) {
    return {
      fillClass: "bg-warning",
      strokeClass: "stroke-warning",
      textClass: "text-warning",
    };
  }
  return {
    fillClass: "bg-destructive",
    strokeClass: "stroke-destructive",
    textClass: "text-destructive",
  };
}
