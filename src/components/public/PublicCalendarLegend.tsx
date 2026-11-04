"use client";

interface PublicCalendarLegendProps {
  locale: string;
}

export function PublicCalendarLegend({ locale }: PublicCalendarLegendProps) {
  const isEn = locale === "en";

  const items = [
    { label: isEn ? "Exams" : "امتحانات", dotClass: "bg-purple-600" },
    { label: isEn ? "Events" : "فعاليات", dotClass: "bg-sky-500" },
    { label: isEn ? "Meetings" : "اجتماعات", dotClass: "bg-amber-500" },
    { label: isEn ? "Today" : "اليوم", dotClass: "bg-[#e5a93b]" },
  ];

  return (
    <div className="flex flex-wrap items-center justify-center gap-4 border-t border-slate-100 px-4 py-3 text-xs font-semibold text-slate-600 dark:border-slate-800 dark:text-slate-300 sm:gap-6">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span className={`size-2 rounded-full ${it.dotClass}`} aria-hidden="true" />
          <span>{it.label}</span>
        </div>
      ))}
    </div>
  );
}

