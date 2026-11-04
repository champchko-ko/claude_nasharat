"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { GraduationCapIcon, ArrowRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function PublicHeroLoginButton() {
  const locale = useLocale();
  const t = useTranslations("home");

  return (
    <Link href={`/${locale}/login`} className="w-full">
      <Button
        size="lg"
        className="h-14 sm:h-16 w-full rounded-2xl px-8 text-base sm:text-lg md:text-xl font-black hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 gap-3.5 sm:gap-4 group cursor-pointer tracking-wide"
      >
        <GraduationCapIcon className="size-6 sm:size-7 transition-transform duration-300 group-hover:scale-110" />
        <span className="font-extrabold">{t("portalSignIn")}</span>
        <ArrowRightIcon className="size-5 rtl:rotate-180 transition-transform duration-300 group-hover:translate-x-1 rtl:group-hover:-translate-x-1" />
      </Button>
    </Link>
  );
}
