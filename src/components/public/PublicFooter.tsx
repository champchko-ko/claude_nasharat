"use client";

import { useTranslations } from "next-intl";
import { ArrowUpIcon } from "lucide-react";

export function PublicFooter() {
  const t = useTranslations("home");
  const currentYear = new Date().getFullYear();

  return (
    <footer className="relative border-t border-border/60 bg-card/60 px-4 sm:px-8 lg:px-12 xl:px-16 py-10 text-xs text-muted-foreground backdrop-blur-xs">
      <div className="mx-auto grid w-full max-w-[1720px] grid-cols-1 items-center gap-4 sm:grid-cols-3">
        <div className="hidden sm:block" />

        <p className="text-center font-medium">
          © {currentYear} <span className="font-semibold text-foreground">{t("title")}</span>. All
          rights reserved.
        </p>

        <div className="flex justify-center sm:justify-end">
          <a
            href="#overview"
            className="inline-flex items-center gap-1.5 rounded-lg border border-border/60 bg-background/80 px-3 py-1.5 text-xs text-muted-foreground shadow-2xs transition-colors hover:text-foreground hover:bg-accent"
          >
            <span>{t("navOverview")}</span>
            <ArrowUpIcon className="size-3.5" />
          </a>
        </div>
      </div>
    </footer>
  );
}
