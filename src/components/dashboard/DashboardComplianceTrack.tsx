import { COMPLIANCE_THRESHOLDS } from "@/lib/dashboard/complianceThresholds";

/**
 * Part-to-whole compliance track: compliant work, then overdue work, then work
 * that is not yet due. The three segments always add up to the denominator, and
 * a hairline tick marks the `good` threshold so a rate can be read against the
 * same benchmark on every row.
 *
 * The track is decorative: the rate and counts are always rendered as text next
 * to it, so assistive technology never depends on the graphic.
 */
export function DashboardComplianceTrack({
  targeted,
  compliant,
  overdue,
  notYetDue,
  heightClass = "h-2.5",
}: {
  targeted: number;
  compliant: number;
  overdue: number;
  notYetDue: number;
  heightClass?: string;
}) {
  const total = Math.max(0, targeted);
  const share = (value: number) =>
    total > 0 ? Math.min(100, Math.max(0, (value / total) * 100)) : 0;

  return (
    <div
      className={`relative w-full overflow-hidden rounded-full border border-border/60 bg-foreground/10 ${heightClass}`}
      aria-hidden="true"
    >
      <div className="flex h-full w-full">
        <div
          className="h-full shrink-0 bg-success transition-[width] duration-500"
          style={{ width: `${share(compliant)}%` }}
        />
        <div
          className="h-full shrink-0 bg-destructive transition-[width] duration-500"
          style={{ width: `${share(overdue)}%` }}
        />
        <div
          className="h-full shrink-0 bg-muted-foreground/45 transition-[width] duration-500"
          style={{ width: `${share(notYetDue)}%` }}
        />
      </div>

      {total > 0 ? (
        <span
          className="pointer-events-none absolute inset-y-0 w-px bg-foreground/45"
          style={{ insetInlineStart: `${COMPLIANCE_THRESHOLDS.good}%` }}
        />
      ) : null}
    </div>
  );
}
