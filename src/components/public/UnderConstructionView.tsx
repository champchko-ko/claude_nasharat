"use client";

import { useTranslations } from "next-intl";
import { WrenchIcon, RefreshCwIcon, ShieldCheckIcon, ClockIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoldDots } from "@/components/ui/gold-dots";
import {
  CARD_SHELL_STATIC,
  CARD_DIAMOND,
  CARD_DIAMOND_ICON,
} from "@/components/ui/diamond-card-styles";

export function UnderConstructionView() {
  const t = useTranslations("underConstruction");

  const handleRefresh = () => {
    window.location.reload();
  };

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-between overflow-hidden bg-background p-4 sm:p-8">
      <div className="absolute inset-0 bg-radial from-primary/5 via-transparent to-transparent" />
      <GoldDots className="opacity-40" />

      {/* Top Header Controls */}
      <header className="relative z-10 flex w-full max-w-5xl items-center justify-between py-2">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-lg border border-primary/20 bg-primary/10 text-primary">
            <ShieldCheckIcon className="size-5" />
          </div>
          <span className="font-heading text-sm font-bold tracking-tight text-foreground sm:text-base">
            {t("poweredBy")}
          </span>
        </div>
      </header>

      {/* Hero Notice Card */}
      <section className="relative z-10 my-auto flex w-full max-w-xl flex-col items-center text-center">
        <div className={`${CARD_SHELL_STATIC} relative w-full p-8 sm:p-10 shadow-xl`}>
          {/* Centered Diamond Icon */}
          <div className="mx-auto mb-6 flex items-center justify-center">
            <div className={`${CARD_DIAMOND} size-16 sm:size-20 bg-primary/10 border-primary/30`}>
              <WrenchIcon className={`${CARD_DIAMOND_ICON} size-8 sm:size-10 text-primary`} />
            </div>
          </div>

          {/* Badge */}
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
            <span className="relative flex size-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
              <span className="relative inline-flex size-2 rounded-full bg-primary" />
            </span>
            <span>{t("badge")}</span>
          </div>

          {/* Main Headings */}
          <h1 className="font-heading text-2xl font-extrabold tracking-tight text-foreground sm:text-3xl">
            {t("title")}
          </h1>
          <p className="mt-3 text-sm leading-relaxed text-muted-foreground sm:text-base">
            {t("subtitle")}
          </p>

          {/* Information Pill */}
          <div className="mt-6 flex flex-col gap-2 rounded-lg border border-border/60 bg-muted/30 p-3 text-xs text-muted-foreground sm:text-sm">
            <div className="flex items-center justify-center gap-2 font-medium text-foreground">
              <ClockIcon className="size-4 text-primary" />
              <span>{t("status")}</span>
            </div>
            <p className="text-xs">{t("contact")}</p>
          </div>

          {/* Refresh Action */}
          <div className="mt-6 flex justify-center">
            <Button
              type="button"
              variant="outline"
              onClick={handleRefresh}
              className="gap-2 text-xs sm:text-sm"
            >
              <RefreshCwIcon className="size-3.5" />
              <span>{t("backHome")}</span>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="relative z-10 py-4 text-center text-xs text-muted-foreground">
        <p>
          &copy; {new Date().getFullYear()} {t("poweredBy")}
        </p>
      </footer>
    </main>
  );
}

