"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { ClipboardListIcon, HeartHandshakeIcon, UsersIcon } from "lucide-react";
import { PublicDocumentCard } from "./PublicDocumentCard";
import { SchoolDocumentPreviewDialog } from "@/components/documents/SchoolDocumentPreviewDialog";
import type { SchoolDocumentRow, SchoolDocumentSlug } from "@/lib/documents/types";

export function PublicDocumentsSection({
  documents = [],
}: {
  documents?: SchoolDocumentRow[];
}) {
  const t = useTranslations("home");
  const [activeSlug, setActiveSlug] = useState<SchoolDocumentSlug | null>(null);

  const getSlugTitle = (slug: SchoolDocumentSlug) => {
    if (slug === "operational-plan") return t("docOperationalPlanTitle");
    if (slug === "committees-guide") return t("docCommitteesGuideTitle");
    return t("docCounselingGuideTitle");
  };

  const activeDocuments = activeSlug
    ? documents.filter((doc) => doc.slug === activeSlug)
    : [];

  return (
    <section aria-label={t("documentsTitle")} className="w-full space-y-6 pt-4 sm:pt-6">
      <div className="space-y-3 animate-hero-fade-down">
        <div className="flex items-center justify-center gap-3 text-xs sm:text-sm font-bold text-gold">
          <span className="h-0.5 w-12 rounded-full bg-gold/70" />
          <span>{t("documentsEyebrow")}</span>
          <span className="h-0.5 w-12 rounded-full bg-gold/70" />
        </div>

        <h2 className="font-heading text-2xl font-black tracking-tight text-[#0a2f7a] sm:text-3xl lg:text-4xl dark:text-foreground">
          {t("documentsTitle")}
        </h2>

        <div className="mx-auto h-0.5 w-28 rounded-full bg-gradient-to-r from-gold via-gold/80 to-[#0a2f7a] dark:to-primary" />

        <p className="mx-auto max-w-2xl text-xs sm:text-sm text-muted-foreground leading-relaxed">
          {t("documentsSubtitle")}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-6 lg:gap-8 pt-8 items-stretch">
        <div className="h-full animate-hero-fade-up delay-200">
          <PublicDocumentCard
            icon={ClipboardListIcon}
            title={t("docOperationalPlanTitle")}
            description={t("docOperationalPlanDesc")}
            actionLabel={t("documentViewAction")}
            onAction={() => setActiveSlug("operational-plan")}
          />
        </div>
        <div className="h-full animate-hero-fade-up delay-350">
          <PublicDocumentCard
            icon={UsersIcon}
            title={t("docCommitteesGuideTitle")}
            description={t("docCommitteesGuideDesc")}
            actionLabel={t("documentViewAction")}
            onAction={() => setActiveSlug("committees-guide")}
          />
        </div>
        <div className="h-full animate-hero-fade-up delay-500">
          <PublicDocumentCard
            icon={HeartHandshakeIcon}
            title={t("docCounselingGuideTitle")}
            description={t("docCounselingGuideDesc")}
            actionLabel={t("documentViewAction")}
            onAction={() => setActiveSlug("counseling-guide")}
          />
        </div>
      </div>

      {activeSlug ? (
        <SchoolDocumentPreviewDialog
          isOpen={Boolean(activeSlug)}
          onClose={() => setActiveSlug(null)}
          documents={activeDocuments}
          categoryTitle={getSlugTitle(activeSlug)}
        />
      ) : null}
    </section>
  );
}

