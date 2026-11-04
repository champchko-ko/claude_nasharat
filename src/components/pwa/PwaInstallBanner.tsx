"use client";

import { Download } from "lucide-react";
import { useTranslations } from "next-intl";
import { useDrawerEscape } from "@/components/layout/useDrawerEscape";
import { usePwaInstall } from "./usePwaInstall";
import { IosInstallDialog } from "./IosInstallDialog";

export function PwaInstallBanner() {
  const { isInstallable, isIos, isIosGuideOpen, closeIosGuide, promptInstall, dismiss } =
    usePwaInstall();
  const t = useTranslations("pwa");

  const isPromptOpen = isInstallable && !isIosGuideOpen;

  useDrawerEscape(dismiss, isPromptOpen);

  return (
    <>
      {isPromptOpen ? (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="pwa-install-title"
          aria-describedby="pwa-install-desc"
          className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-scrim/60 p-4 backdrop-blur-sm duration-200 fade-in"
        >
          <div className="w-full max-w-sm animate-in rounded-2xl border border-border bg-card p-6 text-center text-card-foreground shadow-2xl duration-200 zoom-in-95">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-sm">
              <Download className="h-6 w-6" />
            </div>

            <h2 id="pwa-install-title" className="mt-4 text-lg font-semibold">
              {t("bannerTitle")}
            </h2>
            <p id="pwa-install-desc" className="mt-2 text-sm text-muted-foreground">
              {isIos ? t("bannerSubtitleIos") : t("bannerSubtitle")}
            </p>

            <div className="mt-6 flex flex-col gap-2">
              <button
                type="button"
                onClick={promptInstall}
                className="w-full rounded-xl bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground shadow transition hover:opacity-90 active:scale-95"
              >
                {isIos ? t("iosGuideButton") : t("installButton")}
              </button>
              <button
                type="button"
                onClick={dismiss}
                className="w-full rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground transition hover:bg-muted hover:text-foreground"
              >
                {t("skipForNow")}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <IosInstallDialog isOpen={isIosGuideOpen} onClose={closeIosGuide} />
    </>
  );
}
