"use client";

import { useLocale, useTranslations } from "next-intl";
import { EyeIcon, TargetIcon } from "lucide-react";
import type { SchoolFullDetails } from "@/lib/school/getSchoolFullDetails";
import { resolveLocalizedText } from "@/lib/school/resolveLocalizedText";

export function DashboardVisionMission({ school }: { school: SchoolFullDetails | null }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  if (!school) return null;

  const vision = resolveLocalizedText(locale, school.vision_ar, school.vision_en, school.vision);
  const mission = resolveLocalizedText(
    locale,
    school.mission_ar,
    school.mission_en,
    school.mission,
  );

  if (!vision && !mission) return null;

  return (
    <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
      {vision ? (
        <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-3 text-xs shadow-2xs backdrop-blur-xs">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-gold shadow-xs">
            <EyeIcon className="size-4 text-gold" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <span className="block font-semibold text-foreground/90">{t("vision")}</span>
            <p className="line-clamp-2 leading-relaxed text-muted-foreground">{vision}</p>
          </div>
        </div>
      ) : null}

      {mission ? (
        <div className="flex items-start gap-3 rounded-lg border border-border/70 bg-background/60 p-3 text-xs shadow-2xs backdrop-blur-xs">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-primary text-gold shadow-xs">
            <TargetIcon className="size-4 text-gold" />
          </div>
          <div className="min-w-0 space-y-0.5">
            <span className="block font-semibold text-foreground/90">{t("mission")}</span>
            <p className="line-clamp-2 leading-relaxed text-muted-foreground">{mission}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}
