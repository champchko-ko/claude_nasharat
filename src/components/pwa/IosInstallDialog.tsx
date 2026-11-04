"use client";

import { useTranslations } from "next-intl";
import { X, Smartphone, Compass } from "lucide-react";
import { useDrawerEscape } from "@/components/layout/useDrawerEscape";
import { IosInstallStepList } from "./IosInstallStepList";

export function IosInstallDialog({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const t = useTranslations("pwa");

  useDrawerEscape(onClose, isOpen);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ios-install-title"
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-scrim/60 p-4 backdrop-blur-sm duration-200 fade-in"
      onClick={onClose}
    >
      <div
        className="relative w-full max-w-md animate-in rounded-2xl border border-border bg-card p-6 text-card-foreground shadow-2xl duration-200 zoom-in-95"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-5 w-5" />
            </div>
            <div>
              <h2 id="ios-install-title" className="text-base font-semibold">
                {t("iosGuideTitle")}
              </h2>
              <p className="text-xs text-muted-foreground">{t("iosGuideSubtitle")}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("closeGuide")}
            className="rounded-lg p-1.5 text-muted-foreground transition hover:bg-muted hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="my-5 flex items-center gap-2 rounded-xl bg-muted/60 p-3 text-xs text-muted-foreground">
          <Compass className="h-4 w-4 shrink-0 text-primary" />
          <span>{t("safariNotice")}</span>
        </div>

        <IosInstallStepList />

        <div className="mt-6 flex justify-end border-t border-border pt-4">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-xl bg-primary px-4 py-2 text-xs font-medium text-primary-foreground shadow transition hover:opacity-90 active:scale-95 sm:w-auto"
          >
            {t("gotIt")}
          </button>
        </div>
      </div>
    </div>
  );
}
