/**
 * Compliance bands shared by every dashboard surface.
 *
 * `good` doubles as the benchmark drawn on the compliance chart: a department
 * at or above it is fully in the success band, so the chart's reference tick
 * and the colour thresholds can never drift apart.
 */
export const COMPLIANCE_THRESHOLDS = {
  good: 80,
  warning: 50,
} as const;
