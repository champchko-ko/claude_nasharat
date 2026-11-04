"use client";

import { useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { MenuIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { MobileNavDrawer } from "./MobileNavDrawer";
import { useIsMounted } from "./useIsMounted";
import { resolveSchoolName } from "@/lib/school/resolveSchoolName";
import { parseSchoolNameHierarchy } from "@/lib/school/parseSchoolNameHierarchy";
import type { SchoolRow } from "@/lib/school/getCurrentSchool";

export function MobileNav({
  school,
  isOwner = false,
  canManageSettings,
  canViewReports,
  canBackupRestore = false,
  canViewDocuments = false,
}: {
  school: SchoolRow | null;
  isOwner?: boolean;
  canManageSettings: boolean;
  canViewReports: boolean;
  canBackupRestore?: boolean;
  canViewDocuments?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const isMounted = useIsMounted();
  const t = useTranslations("nav");
  const locale = useLocale();
  const schoolName = resolveSchoolName(school, locale, t("portal"));
  const { hierarchy, primaryName } = parseSchoolNameHierarchy(schoolName);

  return (
    <div className="md:hidden">
      <Button
        variant="ghost"
        size="icon"
        onClick={() => setIsOpen(true)}
        aria-label={t("openMenu")}
      >
        <MenuIcon className="size-5" />
      </Button>

      {isOpen && isMounted ? (
        <MobileNavDrawer
          school={school}
          schoolName={schoolName}
          hierarchy={hierarchy}
          primaryName={primaryName}
          isOwner={isOwner}
          canManageSettings={canManageSettings}
          canViewReports={canViewReports}
          canBackupRestore={canBackupRestore}
          canViewDocuments={canViewDocuments}
          onClose={() => setIsOpen(false)}
        />
      ) : null}
    </div>
  );
}
