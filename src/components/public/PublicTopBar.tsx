"use client";

import { useLocale, useTranslations } from "next-intl";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { LanguageSwitcher } from "@/components/layout/LanguageSwitcher";
import { PublicInstagramLink } from "./PublicInstagramLink";
import { KuwaitMoeLink } from "./KuwaitMoeLink";
import { PublicTopBarTicker } from "./PublicTopBarTicker";
import type { CalendarEventRow } from "@/lib/calendar/types";
import type { PublicSchoolProfileRow } from "@/lib/school/getPublicSchoolProfile";
import { resolveLocalizedText } from "@/lib/school/resolveLocalizedText";
import { parseSchoolNameHierarchy } from "@/lib/school/parseSchoolNameHierarchy";

/** Navy top bar with Kuwait MOE branding, school title, Instagram link, and ticker. */
export function PublicTopBar({
  school,
  events,
  isOwner = false,
}: {
  school: PublicSchoolProfileRow | null;
  events: CalendarEventRow[];
  isOwner?: boolean;
}) {
  const locale = useLocale();
  const t = useTranslations("home");

  const rawName = resolveLocalizedText(locale, school?.name_ar, school?.name_en);
  const { primaryName } = parseSchoolNameHierarchy(rawName);
  const brand = primaryName || t("title");
  const description = school?.public_description || t("subtitle");

  return (
    <header className="sticky top-0 z-50 border-b-4 border-gold bg-[linear-gradient(90deg,var(--topbar-from,var(--sidebar)),var(--topbar-to,var(--sidebar)))] text-sidebar-foreground shadow-md">
      <div className="mx-auto grid w-full max-w-[1720px] grid-cols-1 items-center gap-4 px-4 py-3 sm:px-8 md:grid-cols-3 lg:px-12 xl:px-16">
        <div className="flex items-center justify-center md:justify-start">
          <KuwaitMoeLink />
        </div>

        <div className="min-w-0 space-y-1 text-center">
          <h1 className="truncate text-base font-black tracking-wide sm:text-xl text-sidebar-foreground">
            {brand}
          </h1>
          {description ? (
            <p className="line-clamp-2 text-xs font-medium text-sidebar-foreground/80 sm:line-clamp-1 max-w-2xl mx-auto">
              {description}
            </p>
          ) : null}
        </div>

        <div className="flex shrink-0 items-center justify-center gap-2.5 md:justify-end">
          <PublicInstagramLink url={school?.instagram_url} />
          {isOwner ? (
            <>
              <LanguageSwitcher />
              <ThemeToggle />
            </>
          ) : null}
        </div>
      </div>

      <PublicTopBarTicker events={events} />
    </header>
  );
}
