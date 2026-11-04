import type { LucideIcon } from "lucide-react";
import {
  CARD_DIAMOND,
  CARD_DIAMOND_ICON,
  CARD_HERO_PADDING,
  CARD_RULE,
  CARD_SHELL,
} from "./publicCardStyles";

export function PublicHeroSideCard({
  icon: Icon,
  title,
  content,
}: {
  icon: LucideIcon;
  title: string;
  content: string;
}) {
  return (
    <div className={`${CARD_SHELL} ${CARD_HERO_PADDING} h-full`}>
      <div className={CARD_DIAMOND}>
        <Icon className={`size-5 ${CARD_DIAMOND_ICON}`} />
      </div>
      <h3 className="mb-3 text-lg font-extrabold tracking-tight text-foreground sm:text-xl">{title}</h3>
      <div className={CARD_RULE} />
      <p className="flex-1 text-sm leading-relaxed text-muted-foreground whitespace-pre-line sm:text-base">
        {content}
      </p>
    </div>
  );
}
