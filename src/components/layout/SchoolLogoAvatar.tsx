"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { GraduationCapIcon } from "lucide-react";
import type { SchoolRow } from "@/lib/school/getCurrentSchool";
import { getSchoolLogoUrl } from "@/lib/school/getSchoolLogoUrl";

export function SchoolLogoAvatar({
  school,
  className = "size-9",
  iconClassName = "size-5",
}: {
  school?: SchoolRow | null;
  className?: string;
  iconClassName?: string;
}) {
  const t = useTranslations("common");
  const logoUrl = getSchoolLogoUrl(school?.logo_path);

  if (logoUrl) {
    return (
      <div
        className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg border border-border bg-background p-1 shadow-xs ${className}`}
      >
        <Image
          src={logoUrl}
          alt={school?.name_ar || school?.name_en || t("schoolLogoAlt")}
          width={40}
          height={40}
          unoptimized
          className="size-full object-contain"
        />
      </div>
    );
  }

  return (
    <div
      className={`flex shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-xs ${className}`}
    >
      <GraduationCapIcon className={iconClassName} />
    </div>
  );
}
