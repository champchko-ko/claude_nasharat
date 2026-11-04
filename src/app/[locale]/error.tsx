"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { AlertCircleIcon, RefreshCwIcon, HomeIcon } from "lucide-react";
import { Button, buttonVariants } from "@/components/ui/button";
import { Link } from "@/i18n";
import { reportClientError } from "@/lib/logger/reportClientError";
import { resolveClientErrorReference } from "@/lib/logger/resolveClientErrorReference";
import { cn } from "@/lib/cn";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const t = useTranslations("errors");
  const tCommon = useTranslations("common");
  // Stable across re-renders, so the code on screen is the code that was logged.
  const referenceId = resolveClientErrorReference(error);

  useEffect(() => {
    reportClientError(error, "boundary");
  }, [error]);

  return (
    <div className="flex min-h-[60vh] items-center justify-center p-6">
      <div className="w-full max-w-md rounded-2xl border border-border bg-card p-8 text-center shadow-lg">
        <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
          <AlertCircleIcon className="size-8" />
        </div>

        <h2 className="mb-2 text-xl font-bold tracking-tight text-foreground">
          {t("serverErrorTitle")}
        </h2>

        <p className="mb-6 text-sm text-muted-foreground">{t("serverErrorDesc")}</p>

        {referenceId && (
          <div className="mb-6 rounded-lg border border-border bg-muted/50 px-3 py-2 font-mono text-xs text-muted-foreground">
            {t("referenceCode", { code: referenceId })}
          </div>
        )}

        <div className="flex flex-col gap-2.5 sm:flex-row sm:justify-center">
          <Button onClick={() => reset()} className="gap-2">
            <RefreshCwIcon className="size-4" />
            <span>{tCommon("retry")}</span>
          </Button>

          <Link href="/" className={cn(buttonVariants({ variant: "outline" }), "gap-2")}>
            <HomeIcon className="size-4" />
            <span>{tCommon("goHome")}</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
