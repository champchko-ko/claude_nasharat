import { getTranslations, setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n";
import { ForgotPasswordForm } from "@/components/auth/ForgotPasswordForm";
import { getSessionUser } from "@/lib/auth/getSessionUser";
import { getCurrentSchool } from "@/lib/school/getCurrentSchool";
import { AuthShell } from "@/components/auth/AuthShell";
import { MailIcon } from "lucide-react";

export default async function ForgotPasswordPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const user = await getSessionUser();
  if (user) redirect({ href: "/dashboard", locale });

  const t = await getTranslations("auth");
  const school = await getCurrentSchool();
  const schoolName = school ? (locale === "ar" ? school.name_ar : school.name_en) : null;

  return (
    <AuthShell
      school={school}
      schoolName={schoolName}
      icon={<MailIcon className="size-5" />}
      title={t("forgotPasswordTitle")}
      description={t("forgotPasswordDesc")}
    >
      <ForgotPasswordForm />
    </AuthShell>
  );
}
