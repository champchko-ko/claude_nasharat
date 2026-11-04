"use client";

import { useTranslations } from "next-intl";
import { UserCheckIcon } from "lucide-react";
import {
  CARD_DIAMOND,
  CARD_DIAMOND_ICON,
  CARD_HERO_PADDING,
  CARD_RULE,
  CARD_SHELL,
} from "./publicCardStyles";

export function PublicHeroLeadershipCard({
  manager,
  assistant1,
  assistant2,
}: {
  manager?: string | null;
  assistant1?: string | null;
  assistant2?: string | null;
}) {
  const t = useTranslations("home");
  const tSettings = useTranslations("settings");

  return (
    <div className={`${CARD_SHELL} ${CARD_HERO_PADDING} w-full`}>
      <div className={CARD_DIAMOND}>
        <UserCheckIcon className={`size-5 ${CARD_DIAMOND_ICON}`} />
      </div>
      <h3 className="mb-3 text-lg font-extrabold tracking-tight text-foreground sm:text-xl">
        {tSettings("leadership")}
      </h3>
      <div className={CARD_RULE} />
      <div className="flex-1 space-y-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
        {manager && (
          <p>
            {t("managerTitle")}: <span className="font-semibold text-foreground">{manager}</span>
          </p>
        )}
        {assistant1 && (
          <p>
            {t("assistantManager1Title")}:{" "}
            <span className="font-semibold text-foreground">{assistant1}</span>
          </p>
        )}
        {assistant2 && (
          <p>
            {t("assistantManager2Title")}:{" "}
            <span className="font-semibold text-foreground">{assistant2}</span>
          </p>
        )}
      </div>
    </div>
  );
}
