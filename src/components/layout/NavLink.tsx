"use client";

import { usePathname } from "@/i18n";
import { Link } from "@/i18n";
import { cn } from "@/lib/cn";
import { isNavLinkActive } from "./isNavLinkActive";

export function NavLink({
  href,
  label,
  icon: Icon,
  badge,
  exact = false,
  excludedPrefixes,
  onClick,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: number | string;
  exact?: boolean;
  excludedPrefixes?: string[];
  onClick?: () => void;
}) {
  const pathname = usePathname();
  const isActive = isNavLinkActive({ pathname, href, exact, excludedPrefixes });

  return (
    <Link
      href={href}
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-md border px-4 py-3 text-sm font-medium transition-[transform,box-shadow,border-color] duration-300 ease-[cubic-bezier(.22,1,.36,1)]",
        isActive
          ? "border-transparent bg-sidebar-primary bg-[linear-gradient(90deg,var(--nav-active-from,var(--sidebar-primary))_-30%,var(--nav-active-to,var(--sidebar-primary))_110%)] font-semibold text-gold shadow-[0_8px_18px_rgba(10,47,122,.35)]"
          : "border-sidebar-border bg-sidebar-accent/40 text-sidebar-foreground/90 hover:border-sidebar-primary/40 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_8px_18px_rgba(0,0,0,.18)] hover:ltr:translate-x-1 hover:rtl:-translate-x-1",
      )}
    >
      <span className="flex-1 truncate">{label}</span>
      {badge !== undefined && (
        <span
          className={cn(
            "rounded-full px-2 py-0.5 text-xs font-semibold",
            isActive
              ? "bg-sidebar-foreground/20 text-[color:var(--nav-active-foreground,var(--sidebar-primary-foreground))]"
              : "bg-sidebar-accent text-sidebar-accent-foreground",
          )}
        >
          {badge}
        </span>
      )}
      <Icon
        className={cn(
          "size-5 shrink-0 transition-[opacity,transform] duration-300",
          isActive ? "opacity-100" : "opacity-85 group-hover:scale-110 group-hover:opacity-100",
        )}
      />
    </Link>
  );
}
