import { setRequestLocale } from "next-intl/server";
import { redirect } from "@/i18n";
import { getCurrentProfile } from "@/lib/auth/getCurrentProfile";
import { isPlatformOwner } from "@/lib/auth/isPlatformOwner";
import { resolveSchoolForCaller } from "@/lib/school/resolveSchoolForCaller";
import { getSchoolAchievements } from "@/lib/achievements/getSchoolAchievements";
import { getSchoolDepartments } from "@/lib/school/getSchoolDepartments";
import { SchoolAchievementsHub } from "@/components/achievements/SchoolAchievementsHub";

export default async function AchievementsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);

  const profile = await getCurrentProfile();
  if (!profile) {
    redirect({ href: "/login", locale });
    return null;
  }

  const isOwner = await isPlatformOwner(profile.id);
  if (!isOwner) {
    redirect({ href: "/dashboard", locale });
    return null;
  }

  const schoolId = await resolveSchoolForCaller(profile);
  const [achievements, departments] = await Promise.all([
    getSchoolAchievements(schoolId),
    getSchoolDepartments(schoolId),
  ]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <SchoolAchievementsHub
        achievements={achievements}
        departments={departments}
        canManage={true}
      />
    </div>
  );
}
