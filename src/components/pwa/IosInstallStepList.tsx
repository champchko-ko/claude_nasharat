"use client";

import { useTranslations } from "next-intl";
import { Share, SquarePlus, Plus } from "lucide-react";

export function IosInstallStepList() {
  const t = useTranslations("pwa");

  const steps = [
    {
      num: 1,
      title: t("step1Title"),
      desc: t("step1Desc"),
      icon: <Share className="h-3.5 w-3.5" />,
    },
    {
      num: 2,
      title: t("step2Title"),
      desc: t("step2Desc"),
      icon: <SquarePlus className="h-3.5 w-3.5" />,
    },
    {
      num: 3,
      title: t("step3Title"),
      desc: t("step3Desc"),
      icon: <Plus className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <div className="space-y-4">
      {steps.map((step) => (
        <div key={step.num} className="flex items-start gap-3.5">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-primary/15 text-xs font-bold text-primary">
            {step.num}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1.5 text-sm font-medium">
              <span>{step.title}</span>
              <span className="inline-flex items-center justify-center rounded-md bg-muted px-1.5 py-0.5 text-primary">
                {step.icon}
              </span>
            </div>
            <p className="text-xs leading-relaxed text-muted-foreground">{step.desc}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
