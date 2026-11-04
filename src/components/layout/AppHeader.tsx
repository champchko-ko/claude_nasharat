"use client";

import { LanguageSwitcher } from "./LanguageSwitcher";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { NotificationBell } from "@/components/notifications/NotificationBell";
import { PublicInstagramLink } from "@/components/public/PublicInstagramLink";
import { AppUserMenu } from "./AppUserMenu";
import { MobileNav } from "./MobileNav";
import { AppHeaderGreeting } from "./AppHeaderGreeting";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";
import type { SchoolRow } from "@/lib/school/getCurrentSchool";

export function AppHeader({
  profile,
  school,
  isOwner = false,
  canManageSettings,
  canViewReports,
  canBackupRestore = false,
  canViewDocuments = false,
  unreadNotifications = 0,
}: {
  profile: ProfileRow | null;
  school: SchoolRow | null;
  isOwner?: boolean;
  canManageSettings: boolean;
  canViewReports: boolean;
  canBackupRestore?: boolean;
  canViewDocuments?: boolean;
  unreadNotifications?: number;
}) {
  return (
    <header className="sticky top-0 z-40 flex h-16 w-full shrink-0 items-center justify-between border-b-4 border-gold bg-[linear-gradient(90deg,var(--topbar-from,var(--sidebar)),var(--topbar-to,var(--sidebar)))] px-4 text-sidebar-foreground sm:px-6">
      <div className="flex items-center gap-3">
        <MobileNav
          school={school}
          isOwner={isOwner}
          canManageSettings={canManageSettings}
          canViewReports={canViewReports}
          canBackupRestore={canBackupRestore}
          canViewDocuments={canViewDocuments}
        />
        <AppHeaderGreeting profile={profile} school={school} />
      </div>

      <div className="flex items-center gap-2 sm:gap-3">
        <PublicInstagramLink />
        <NotificationBell unreadCount={unreadNotifications} />
        {isOwner ? (
          <>
            <LanguageSwitcher />
            <ThemeToggle />
            <div className="h-5 w-px bg-sidebar-border" />
          </>
        ) : null}
        <AppUserMenu profile={profile} />
      </div>
    </header>
  );
}
