"use client";

import { useTranslations } from "next-intl";
import { ClipboardListIcon, HeartHandshakeIcon, UsersIcon } from "lucide-react";
import { NavLink } from "./NavLink";

export function NavDocumentLinks({ onSelect }: { onSelect?: () => void }) {
  const t = useTranslations("nav");

  return (
    <>
      <div className="pt-2">
        <div className="mb-1 px-1 text-[11px] font-bold tracking-wider text-sidebar-foreground/60 uppercase">
          {t("schoolDocuments")}
        </div>
      </div>
      <NavLink
        href="/documents/operational-plan"
        label={t("operationalPlan")}
        icon={ClipboardListIcon}
        onClick={onSelect}
      />
      <NavLink
        href="/documents/committees-guide"
        label={t("committeesGuide")}
        icon={UsersIcon}
        onClick={onSelect}
      />
      <NavLink
        href="/documents/counseling-guide"
        label={t("counselingGuide")}
        icon={HeartHandshakeIcon}
        onClick={onSelect}
      />
    </>
  );
}
