import type { ReactNode } from "react";
import { SchoolLogoAvatar } from "@/components/layout/SchoolLogoAvatar";
import {
  CARD_DIAMOND,
  CARD_DIAMOND_ICON,
  CARD_RULE,
  CARD_SHELL_STATIC,
} from "@/components/public/publicCardStyles";
import type { SchoolRow } from "@/lib/school/getCurrentSchool";

/** Shared frame for login / forgot / reset pages (services-guide card look). */
export function AuthShell({
  school,
  schoolName,
  icon,
  title,
  description,
  children,
}: {
  school: SchoolRow | null;
  schoolName: string | null;
  icon: ReactNode;
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center bg-gradient-to-b from-primary/5 via-background to-background px-4 py-20">
      <div
        className={`${CARD_SHELL_STATIC} w-full max-w-md px-6 pt-16 pb-8 sm:px-8 sm:pt-[4.5rem]`}
      >
        <div className={CARD_DIAMOND}>
          <span className={CARD_DIAMOND_ICON}>{icon}</span>
        </div>

        <div className="mb-5 flex flex-col items-center gap-3">
          <SchoolLogoAvatar school={school} className="size-14" iconClassName="size-7" />
          {schoolName && (
            <p className="max-w-xs text-sm font-bold whitespace-pre-line text-muted-foreground">
              {schoolName}
            </p>
          )}
        </div>

        <h1 className="mb-3 text-xl font-extrabold tracking-tight text-foreground sm:text-2xl">
          {title}
        </h1>
        <div className={CARD_RULE} />
        {description && (
          <p className="mb-5 max-w-xs text-xs leading-relaxed text-muted-foreground sm:text-sm">
            {description}
          </p>
        )}

        <div className="flex w-full justify-center">{children}</div>
      </div>
    </main>
  );
}
