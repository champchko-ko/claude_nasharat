"use client";

import { Link } from "@/i18n";
import { ArrowRightIcon, ArrowLeftIcon, ClockIcon, TargetIcon } from "lucide-react";
import { useLocale } from "next-intl";
import { GoldDots } from "@/components/ui/gold-dots";

import { OperationalPlanIcon } from "@/components/icons/OperationalPlanIcon";
import { CommitteesGuideIcon } from "@/components/icons/CommitteesGuideIcon";
import { CounselingGuideIcon } from "@/components/icons/CounselingGuideIcon";

export type SchoolDocumentSlug = "operational-plan" | "committees-guide" | "counseling-guide";

const ICON_MAP = {
  "operational-plan": OperationalPlanIcon,
  "committees-guide": CommitteesGuideIcon,
  "counseling-guide": CounselingGuideIcon,
};

export function SchoolDocumentView({
  slug,
  title,
  description,
}: {
  slug: SchoolDocumentSlug;
  title: string;
  description: string;
}) {
  const locale = useLocale();
  const isRtl = locale === "ar";
  const BackArrow = isRtl ? ArrowRightIcon : ArrowLeftIcon;
  const Icon = ICON_MAP[slug] || TargetIcon;

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-center justify-between border-b border-border/60 pb-4">
        <div>
          <h1 className="flex items-center gap-2.5 font-heading text-2xl font-black text-foreground sm:text-3xl">
            <span>{title}</span>
            <GoldDots />
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">{description}</p>
        </div>

        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-lg border border-border bg-card px-3.5 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <BackArrow className="size-4" />
          <span>{isRtl ? "العودة للوحة التحكم" : "Back to Dashboard"}</span>
        </Link>
      </div>

      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-border/80 bg-card/60 p-12 text-center shadow-xs">
        <div className="mb-4 grid size-16 place-items-center rounded-2xl bg-primary text-gold shadow-xs">
          <Icon className="size-8 text-gold" strokeWidth={2} />
        </div>

        <div className="mb-2 inline-flex items-center gap-1.5 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-xs font-semibold text-amber-600 dark:text-amber-400">
          <ClockIcon className="size-3.5" />
          <span>{isRtl ? "قيد التجهيز والإعداد" : "Under Preparation"}</span>
        </div>

        <h2 className="mt-2 text-lg font-bold text-foreground">{title}</h2>
        <p className="mt-1 max-w-md text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {description}
        </p>
      </div>
    </div>
  );
}
