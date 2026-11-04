"use client";

import { useEffect } from "react";
import Link from "next/link";
import { AlertTriangleIcon, RefreshCwIcon } from "lucide-react";
import { reportClientError } from "@/lib/logger/reportClientError";
import { resolveClientErrorReference } from "@/lib/logger/resolveClientErrorReference";
import { ThemeProvider } from "@/components/theme";
import { PORTAL_THEMES } from "@/components/theme/themeList";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  // Stable across re-renders, so the code on screen is the code that was logged.
  const referenceId = resolveClientErrorReference(error);

  useEffect(() => {
    // A root-boundary crash happens before any app shell exists; this is the
    // only place that can still report it.
    reportClientError(error, "boundary");
  }, [error]);

  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="moe"
      themes={PORTAL_THEMES.map((t) => t.id)}
      enableSystem={false}
    >
      <html lang="ar" dir="rtl" className="h-full">
        <body className="flex min-h-full items-center justify-center bg-background p-6 text-foreground antialiased">
          <div className="w-full max-w-md rounded-2xl border border-border/15 bg-card/5 p-8 text-center shadow-2xl backdrop-blur-sm">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-destructive/10 text-destructive">
              <AlertTriangleIcon className="size-8" />
            </div>

            <h1 className="mb-2 text-xl font-bold tracking-tight text-foreground">
              System Error / خطأ في النظام
            </h1>
            <p className="mb-6 text-sm text-foreground/70">
              An unexpected error occurred while loading the application. Please try again or return
              home.
            </p>

            {referenceId && (
              <div className="mb-6 rounded-lg border border-border/15 bg-card/5 px-3 py-2 font-mono text-xs text-foreground/50">
                Reference: {referenceId}
              </div>
            )}

            <div className="flex flex-col gap-2">
              <button
                onClick={() => reset()}
                type="button"
                className="flex w-full cursor-pointer items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
              >
                <RefreshCwIcon className="size-4" />
                <span>Try Again / إعادة المحاولة</span>
              </button>
              <Link
                href="/"
                className="flex w-full cursor-pointer items-center justify-center rounded-lg border border-border/20 px-4 py-2.5 text-sm font-medium text-foreground/80 transition-colors hover:bg-card/10"
              >
                Return to Home / العودة للرئيسية
              </Link>
            </div>
          </div>
        </body>
      </html>
    </ThemeProvider>
  );
}
