"use client";

import { useTranslations, useLocale } from "next-intl";
import { Link } from "@/i18n";
import { PlusIcon, ArrowRightIcon, ArrowLeftIcon, TargetIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoldDots } from "@/components/ui/gold-dots";
import { OperationalPlanIcon } from "@/components/icons/OperationalPlanIcon";
import { CommitteesGuideIcon } from "@/components/icons/CommitteesGuideIcon";
import { CounselingGuideIcon } from "@/components/icons/CounselingGuideIcon";
import type { SchoolDocumentSlug } from "@/lib/documents/types";

const ICON_MAP = {
  "operational-plan": OperationalPlanIcon,
  "committees-guide": CommitteesGuideIcon,
  "counseling-guide": CounselingGuideIcon,
};

export function SchoolDocumentsManagerHeader({
  slug,
  title,
  description,
  onAdd,
}: {
  slug: SchoolDocumentSlug;
  title: string;
  description: string;
  onAdd: () => void;
}) {
  const t = useTranslations("documents");
  const locale = useLocale();
  const isRtl = locale === "ar";
  const BackArrow = isRtl ? ArrowRightIcon : ArrowLeftIcon;
  const CategoryIcon = ICON_MAP[slug] || TargetIcon;

  return (
    <div className="flex flex-col justify-between gap-4 border-b border-border/60 pb-5 sm:flex-row sm:items-center">
      <div className="flex items-start gap-3.5">
        <div className="grid size-12 shrink-0 place-items-center rounded-2xl bg-primary text-gold shadow-xs">
          <CategoryIcon className="size-6 text-gold" strokeWidth={2.2} />
        </div>

        <div>
          <h1 className="flex items-center gap-2.5 font-heading text-2xl font-black text-foreground sm:text-3xl">
            <span>{title}</span>
            <GoldDots />
          </h1>
          <p className="mt-1 text-xs text-muted-foreground sm:text-sm">{description}</p>
        </div>
      </div>

      <div className="flex items-center gap-2.5">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <BackArrow className="size-4" />
          <span>{isRtl ? "لوحة التحكم" : "Dashboard"}</span>
        </Link>

        <Button onClick={onAdd} className="gap-1.5 text-xs shadow-sm sm:text-sm">
          <PlusIcon className="size-4" />
          <span>{t("addDocument")}</span>
        </Button>
      </div>
    </div>
  );
}
