import type { ReactNode } from "react";
import { Link } from "@/i18n";
import { ArrowLeftIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GoldDots } from "@/components/ui/gold-dots";

/** Page title in the services-guide style: navy heading + gold dots, optional back button and action. */
export function PageHeader({
  title,
  subtitle,
  meta,
  action,
  backHref,
  backLabel,
}: {
  title: string;
  subtitle?: string;
  meta?: ReactNode;
  action?: ReactNode;
  backHref?: string;
  backLabel?: string;
}) {
  return (
    <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex items-center gap-4">
        {backHref ? (
          <Link href={backHref}>
            <Button variant="ghost" size="icon" aria-label={backLabel}>
              <ArrowLeftIcon className="size-4 rtl:rotate-180" />
            </Button>
          </Link>
        ) : null}
        <div className="flex flex-col gap-1.5">
          <h1 className="flex items-center gap-3 font-heading text-2xl font-extrabold tracking-tight text-primary sm:text-3xl">
            <span>{title}</span>
            <GoldDots />
          </h1>
          {subtitle ? <p className="text-sm text-muted-foreground">{subtitle}</p> : null}
          {meta}
        </div>
      </div>
      {action}
    </div>
  );
}
