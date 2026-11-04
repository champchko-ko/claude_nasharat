import type { ReactNode } from "react";

export function PublicAboutCard({
  icon,
  iconColorClass,
  title,
  content,
}: {
  icon: ReactNode;
  iconColorClass: string;
  title: string;
  content: string;
}) {
  return (
    <div className="group relative rounded-2xl border border-border/80 bg-card/80 p-6 shadow-xs backdrop-blur-xs transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-md space-y-3.5">
      <div
        className={`flex size-11 items-center justify-center rounded-xl border transition-transform duration-300 group-hover:scale-110 ${iconColorClass}`}
      >
        {icon}
      </div>
      <h3 className="text-base sm:text-lg font-bold text-foreground tracking-tight">{title}</h3>
      <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed whitespace-pre-line">
        {content}
      </p>
    </div>
  );
}
