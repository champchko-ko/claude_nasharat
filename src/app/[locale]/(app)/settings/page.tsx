import { redirect } from "@/i18n";
import { assertCanAccessSettings } from "@/lib/settings/assertCanAccessSettings";

export default async function SettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const access = await assertCanAccessSettings();

  if (!access.allowed) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  const canSchool = access.isOwner || access.permissions.includes("settings.school.update");
  const canUsers =
    access.isOwner ||
    access.permissions.includes("users.manage") ||
    access.permissions.includes("roles.manage");
  const canAudit = access.isOwner;

  if (canSchool) {
    redirect({ href: "/settings/school", locale });
  } else if (canUsers) {
    redirect({ href: "/settings/users", locale });
  } else if (canAudit) {
    redirect({ href: "/settings/audit", locale });
  } else if (access.isOwner) {
    redirect({ href: "/settings/backup", locale });
  } else {
    redirect({ href: "/dashboard", locale });
  }
}
