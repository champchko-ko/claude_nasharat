"use client";

interface PublicCalendarDateBadgeProps {
  date: string | Date;
  locale?: string;
}

export function PublicCalendarDateBadge({ date }: PublicCalendarDateBadgeProps) {
  const d = new Date(date);
  const day = d.getDate();
  const monthAbbr = d
    .toLocaleDateString("en-US", { month: "short" })
    .toUpperCase();

  return (
    <div
      className="flex size-14 shrink-0 flex-col items-center justify-center rounded-xl bg-[#0c1f44] text-white shadow-sm"
      aria-hidden="true"
    >
      <span className="text-xl font-black leading-tight text-[#e5a93b]">{day}</span>
      <span className="text-[10px] font-bold tracking-wider text-slate-300">{monthAbbr}</span>
    </div>
  );
}

