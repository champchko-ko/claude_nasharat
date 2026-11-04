import type { AnchorHTMLAttributes } from "react";
import Image from "next/image";

export function KuwaitMoeLink({
  className = "",
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <a
      href="https://www.moe.edu.kw/"
      target="_blank"
      rel="noopener noreferrer"
      dir="ltr"
      className={`group inline-flex items-center gap-3 text-right transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold ${className}`}
      title="وزارة التربية - دولة الكويت | Ministry of Education"
      aria-label="وزارة التربية - دولة الكويت | Ministry of Education"
      {...props}
    >
      <div className="flex flex-col items-end text-right leading-tight text-sidebar-foreground">
        <span className="text-xs sm:text-sm font-extrabold tracking-tight">
          وزارة التربية
        </span>
        <span className="text-[10px] sm:text-[11px] font-semibold tracking-tight text-sidebar-foreground/90">
          Ministry of Education
        </span>
        <span className="text-[8px] sm:text-[9px] font-medium text-sidebar-foreground/75">
          State of Kuwait | دولة الكويت
        </span>
      </div>

      <Image
        src="/images/kuwait-emblem.svg"
        alt="شعار دولة الكويت - وزارة التربية"
        width={56}
        height={56}
        className="size-12 sm:size-14 shrink-0 drop-shadow-sm transition-transform duration-200 group-hover:scale-105"
      />
    </a>
  );
}
