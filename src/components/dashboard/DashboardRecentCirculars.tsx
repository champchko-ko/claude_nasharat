"use client";

import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { FileTextIcon, ArrowRightIcon } from "lucide-react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { GoldDots } from "@/components/ui/gold-dots";
import { LIST_ROW } from "@/components/ui/diamond-card-styles";
import { CircularPriorityBadge, CircularStatusBadge } from "@/components/circulars";
import type { CircularRow } from "@/lib/circulars/types";

export function DashboardRecentCirculars({ circulars }: { circulars: CircularRow[] }) {
  const t = useTranslations("dashboard");
  const locale = useLocale();

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="flex items-center gap-2.5 text-base font-extrabold text-primary">
          <div className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-primary text-gold shadow-xs">
            <FileTextIcon className="size-4 text-gold" />
          </div>
          <span>{t("recentCirculars")}</span>
          <GoldDots />
        </CardTitle>
        <Link
          href={`/${locale}/circulars`}
          className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
        >
          <span>{t("viewAll")}</span>
          <ArrowRightIcon className="size-3 text-inherit rtl:rotate-180" />
        </Link>
      </CardHeader>
      <CardContent className="space-y-2.5">
        {circulars.length === 0 ? (
          <p className="py-6 text-center text-xs text-muted-foreground">{t("noRecentCirculars")}</p>
        ) : (
          circulars.slice(0, 4).map((c) => (
            <Link
              key={c.id}
              href={`/${locale}/circulars/${c.id}`}
              className={`flex items-center justify-between gap-3 p-3 ${LIST_ROW}`}
            >
              <div className="min-w-0 flex-1">
                <div className="mb-1 flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {c.ref_number}
                  </span>
                  <CircularPriorityBadge priority={c.priority} />
                </div>
                <h4 className="truncate text-xs font-bold text-foreground">{c.title}</h4>
              </div>
              <CircularStatusBadge status={c.status} />
            </Link>
          ))
        )}
      </CardContent>
    </Card>
  );
}
