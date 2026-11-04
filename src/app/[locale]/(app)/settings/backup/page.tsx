import { setRequestLocale, getTranslations } from "next-intl/server";
import { redirect } from "@/i18n";
import { assertCanManageBackup } from "@/lib/backup";
import { BackupRestorePanel } from "@/components/settings";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "backup" });
  return {
    title: t("title"),
  };
}

export default async function BackupSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const access = await assertCanManageBackup();
  if (!access.allowed) {
    redirect({ href: "/dashboard", locale });
    return;
  }

  return <BackupRestorePanel />;
}
