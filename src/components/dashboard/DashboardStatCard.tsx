"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { ArrowRightIcon, type LucideIcon } from "lucide-react";
import {
  CARD_DIAMOND_ICON,
  CARD_DIAMOND_SM_SOLID,
  CARD_FOOTER_BAR,
  CARD_RULE,
  CARD_SHELL,
} from "@/components/ui/diamond-card-styles";

export interface DashboardStatItem {
  title: string;
  count: number;
  desc: string;
  href: string;
  icon: LucideIcon;
  accent: string;
}

export function DashboardStatCard({ item }: { item: DashboardStatItem }) {
  const t = useTranslations("dashboard");
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      className={`${CARD_SHELL} h-full px-5 pt-12 pb-0 focus-visible:outline-3 focus-visible:outline-offset-4 focus-visible:outline-gold`}
    >
      <div className={CARD_DIAMOND_SM_SOLID}>
        <Icon className={`size-6 ${CARD_DIAMOND_ICON}`} />
      </div>
      <div className="text-3xl font-extrabold tracking-tight text-foreground">{item.count}</div>
      <div className="mt-1 text-sm font-bold text-foreground">{item.title}</div>
      <div className={`mt-3 ${CARD_RULE}`} />
      <p className="mb-4 line-clamp-2 flex-1 text-xs leading-relaxed text-muted-foreground">
        {item.desc}
      </p>
      <span className={CARD_FOOTER_BAR}>
        <span>{t("viewAll")}</span>
        <ArrowRightIcon className="size-4 text-inherit transition-transform duration-[400ms] group-hover:translate-x-1 rtl:rotate-180 rtl:group-hover:-translate-x-1" />
      </span>
    </Link>
  );
}
