"use client";

export function NewDashboardProfileModalContent({
  managerName,
  schoolNameAr,
  academicYear,
  visionText,
}: {
  managerName: string;
  schoolNameAr: string;
  academicYear: string;
  visionText: string;
}) {
  return (
    <div className="space-y-2">
      <div className="rounded-lg border bg-muted/30 p-2.5">
        <div className="text-xs font-bold">{managerName}</div>
        <div className="text-[10px] text-muted-foreground">مدير المدرسة (School Manager)</div>
      </div>
      <div className="rounded-lg border bg-muted/30 p-2.5">
        <div className="text-xs font-bold">{schoolNameAr}</div>
        <div className="text-[10px] text-muted-foreground">
          العام الدراسي: {academicYear || "2026/2027"}
        </div>
      </div>
      <div className="rounded-lg bg-primary/5 p-3 text-[11px] leading-relaxed">
        <div className="mb-1 font-bold text-primary">الرؤية المعتمدة:</div>
        <p className="text-muted-foreground">{visionText}</p>
      </div>
    </div>
  );
}
