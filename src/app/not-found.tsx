"use client";

import Link from "next/link";
import { FileQuestionIcon } from "lucide-react";
import { ThemeProvider } from "@/components/theme";
import { PORTAL_THEMES } from "@/components/theme/themeList";

export default function RootNotFound() {
  return (
    <ThemeProvider
      attribute="class"
      defaultTheme="moe"
      themes={PORTAL_THEMES.map((t) => t.id)}
      enableSystem={false}
    >
      <html lang="ar" dir="rtl" className="h-full">
        <body className="flex min-h-full items-center justify-center bg-background p-6 text-foreground antialiased">
          <div className="w-full max-w-md rounded-2xl border border-border/15 bg-card/5 p-8 text-center shadow-xl backdrop-blur-sm">
            <div className="mx-auto mb-4 flex size-14 items-center justify-center rounded-full bg-success/10 text-success">
              <FileQuestionIcon className="size-8" />
            </div>

            <h1 className="mb-2 text-xl font-bold tracking-tight text-foreground">
              404 - Page Not Found / الصفحة غير موجودة
            </h1>
            <p className="mb-6 text-sm text-foreground/70">
              The page you are looking for does not exist or has been moved.
            </p>

            <Link
              href="/"
              className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-primary px-5 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-colors hover:bg-primary/90"
            >
              Return Home / العودة للرئيسية
            </Link>
          </div>
        </body>
      </html>
    </ThemeProvider>
  );
}
