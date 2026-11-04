"use client";

import { useTranslations } from "next-intl";
import { FileQuestionIcon, HomeIcon } from "lucide-react";
import { buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n";
import { cn } from "@/lib/cn";

export default function NotFoundPage() {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary">
          <FileQuestionIcon className="size-8" />
        </div>

        <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground">
          {t("notFoundTitle")}
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">{t("notFoundDesc")}</p>

        <div className="flex justify-center">
          <Link href="/" className={cn(buttonVariants({ variant: "default" }), "gap-2")}>
            <HomeIcon className="size-4" />
            <span>{tCommon("goHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
