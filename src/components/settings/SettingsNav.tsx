"use client";

import { usePathname, Link } from "@/i18n";
import { useTranslations } from "next-intl";
import { cn } from "@/lib/cn";
import { buildSettingsTabs } from "./buildSettingsTabs";

export function SettingsNav({
  canManageSchool = true,
  canManageUsers = true,
  canViewAudit = true,
  canBackupRestore = false,
}: {
  canManageSchool?: boolean;
  canManageUsers?: boolean;
  canViewAudit?: boolean;
  canBackupRestore?: boolean;
}) {
  const pathname = usePathname();
  const t = useTranslations("settings");
  const tabs = buildSettingsTabs(t, {
    canManageSchool,
    canManageUsers,
    canViewAudit,
    canBackupRestore,
  });

  return (
    <div className="flex overflow-x-auto border-b border-border pb-px">
      <div className="flex min-w-full gap-2">
        {tabs.map((tab) => {
          const isActive = pathname.startsWith(tab.href);
          const Icon = tab.icon;

          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors",
                isActive
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:border-border hover:text-foreground",
              )}
            >
              <Icon className="size-4 shrink-0" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
