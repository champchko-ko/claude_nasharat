"use client";

import { useLocale, useTranslations } from "next-intl";
import { CalendarIcon, Building2Icon } from "lucide-react";
import type { ProfileRow } from "@/lib/auth/getCurrentProfile";
import type { SchoolRow } from "@/lib/school/getCurrentSchool";
import { resolveDepartmentName } from "@/lib/auth/resolveDepartmentName";

export function AppHeaderGreeting({
  profile,
  school,
}: {
  profile: ProfileRow | null;
  school: SchoolRow | null;
}) {
  const t = useTranslations("dashboard");
  const locale = useLocale();
  const departmentName = resolveDepartmentName(profile, locale);

  const todayStr = new Date().toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="flex items-center gap-2.5 font-human text-sm sm:gap-3">
      {profile?.full_name && (
        <span className="hidden text-base font-bold text-sidebar-foreground sm:inline">
          {t("welcome", { name: profile.full_name })}
        </span>
      )}
      {departmentName && (
        <span className="hidden items-center gap-1.5 rounded-xl border border-gold/35 bg-gold/15 px-3 py-1.5 text-xs font-semibold text-gold shadow-2xs sm:inline-flex sm:text-sm">
          <Building2Icon className="size-3.5" />
          {departmentName}
        </span>
      )}
      {school?.academic_year && (
        <span className="hidden rounded-xl border border-sidebar-border/80 bg-sidebar px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/80 shadow-2xs sm:text-sm md:inline-flex">
          {school.academic_year}
        </span>
      )}
      <div className="hidden items-center gap-2 rounded-xl border border-sidebar-border/80 bg-sidebar px-3 py-1.5 text-xs font-semibold text-sidebar-foreground/80 shadow-2xs sm:text-sm lg:flex">
        <CalendarIcon className="size-4" />
        <span>{todayStr}</span>
      </div>
    </div>
  );
}
