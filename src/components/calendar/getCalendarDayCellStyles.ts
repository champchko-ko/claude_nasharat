export function getCalendarDayCellStyles({
  isToday,
  isSelected,
  isWeekend,
}: {
  isToday: boolean;
  isSelected: boolean;
  isWeekend?: boolean;
}): { cellClass: string; eventDotClass: string; circularDotClass: string } {
  const cellClass = isToday
    ? "border border-gold bg-[linear-gradient(180deg,var(--gold),var(--rule-from))] text-gold-foreground shadow-[0_4px_10px_rgba(184,138,42,.45)]"
    : isSelected
      ? "bg-[color:var(--action-from,var(--primary))] text-[color:var(--action-foreground,#fff)] shadow-[0_6px_14px_rgba(10,47,122,.35)]"
      : isWeekend
        ? "text-muted-foreground hover:bg-card"
        : "text-foreground hover:bg-card";
  const eventDotClass = isToday
    ? "bg-gold-foreground"
    : isSelected
      ? "bg-gold"
      : "bg-[color:var(--action-from,var(--primary))]";
  return { cellClass, eventDotClass, circularDotClass: "bg-chart-4" };
}
