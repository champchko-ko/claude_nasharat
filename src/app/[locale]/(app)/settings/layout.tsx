import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n";
import { SettingsNav } from "@/components/settings";
import { assertCanAccessSettings } from "@/lib/settings/assertCanAccessSettings";

export default async function SettingsLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const access = await assertCanAccessSettings();
  if (!access.allowed) {
    redirect({ href: "/dashboard", locale });
  }

  const t = await getTranslations("settings");

  const canSchool = access.isOwner || access.permissions.includes("settings.school.update");
  const canUsers =
    access.isOwner ||
    access.permissions.includes("users.manage") ||
    access.permissions.includes("roles.manage");
  const canAudit = access.isOwner;
  const canBackupRestore = access.isOwner;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("subtitle")}</p>
      </div>
      <SettingsNav
        canManageSchool={canSchool}
        canManageUsers={canUsers}
        canViewAudit={canAudit}
        canBackupRestore={canBackupRestore}
      />
      <div className="mt-2">{children}</div>
    </div>
  );
}
