import {
  SchoolIcon,
  Building2Icon,
  MapPinIcon,
  UsersIcon,
  ShieldAlertIcon,
  Database,
} from "lucide-react";

export type SettingsTabItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export function buildSettingsTabs(
  t: (key: string) => string,
  flags: {
    canManageSchool?: boolean;
    canManageUsers?: boolean;
    canViewAudit?: boolean;
    canBackupRestore?: boolean;
  },
): SettingsTabItem[] {
  const tabs: SettingsTabItem[] = [];

  if (flags.canManageSchool) {
    tabs.push({ href: "/settings/school", label: t("school"), icon: SchoolIcon });
    tabs.push({ href: "/settings/departments", label: t("departments"), icon: Building2Icon });
    tabs.push({ href: "/settings/locations", label: t("locations"), icon: MapPinIcon });
  }
  if (flags.canManageUsers) {
    tabs.push({ href: "/settings/users", label: t("users"), icon: UsersIcon });
  }
  if (flags.canViewAudit) {
    tabs.push({ href: "/settings/audit", label: t("audit"), icon: ShieldAlertIcon });
  }
  if (flags.canBackupRestore) {
    tabs.push({ href: "/settings/backup", label: t("backup"), icon: Database });
  }

  return tabs;
}
