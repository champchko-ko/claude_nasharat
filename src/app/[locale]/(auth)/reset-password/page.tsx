import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/auth/ResetPasswordForm";
import { getCurrentSchool } from "@/lib/school/getCurrentSchool";
import { AuthShell } from "@/components/auth/AuthShell";
import { LockIcon } from "lucide-react";

export default async function ResetPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const t = await getTranslations("auth");
  const school = await getCurrentSchool();
  const schoolName = school ? (locale === "ar" ? school.name_ar : school.name_en) : null;

  return (
    <AuthShell
      school={school}
      schoolName={schoolName}
      icon={<LockIcon className="size-5" />}
      title={t("resetPasswordTitle")}
      description={t("resetPasswordDesc")}
    >
      <ResetPasswordForm />
    </AuthShell>
  );
}
