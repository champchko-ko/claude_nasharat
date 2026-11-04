import { useTranslations } from "next-intl";
import type { ComplianceDepartmentRef } from "@/lib/reports/types";

const TONES = {
  success: {
    panel: "border-s-success",
    dot: "bg-success",
    title: "text-success",
    count: "bg-success/15 text-success",
  },
  destructive: {
    panel: "border-s-destructive",
    dot: "bg-destructive",
    title: "text-destructive",
    count: "bg-destructive/15 text-destructive",
  },
} as const;

function DepartmentPanel({
  tone,
  title,
  items,
  emptyMark,
}: {
  tone: keyof typeof TONES;
  title: string;
  items: ComplianceDepartmentRef[];
  emptyMark: string;
}) {
  const c = TONES[tone];

  return (
    <div
      className={`space-y-3 rounded-xl border-y border-s-4 border-e border-border ${c.panel} bg-card p-4 shadow-[0_6px_16px_rgba(20,37,74,.08)]`}
    >
      <div className="flex items-center gap-2.5">
        <span className={`text-sm font-extrabold ${c.title}`}>{title}</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-extrabold ${c.count}`}>
          {items.length}
        </span>
      </div>

      <div className="flex flex-wrap gap-2">
        {items.length > 0 ? (
          items.map((d) => (
            <span
              key={d.id}
              className="inline-flex items-center gap-1.5 rounded-md border border-border bg-[linear-gradient(135deg,var(--card),var(--muted))] px-2.5 py-1 text-xs font-bold text-foreground"
            >
              <i aria-hidden="true" className={`size-1.5 rounded-full ${c.dot}`} />
              {d.name}
              {d.outstanding > 0 ? ` · ${d.outstanding}` : ""}
            </span>
          ))
        ) : (
          <span className={`text-sm font-extrabold ${c.title}`}>{emptyMark}</span>
        )}
      </div>
    </div>
  );
}

export function CircularReportExpandedDepts({
  responded,
  pending,
}: {
  responded: ComplianceDepartmentRef[];
  pending: ComplianceDepartmentRef[];
}) {
  const t = useTranslations("circulars");

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <DepartmentPanel
        tone="success"
        title={t("respondedDepartments")}
        items={responded}
        emptyMark="—"
      />
      <DepartmentPanel
        tone="destructive"
        title={t("pendingDepartments")}
        items={pending}
        emptyMark="✓"
      />
    </div>
  );
}
