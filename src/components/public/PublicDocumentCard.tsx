import { ArrowRightIcon } from "lucide-react";
import {
  CARD_DIAMOND_ICON,
  CARD_DIAMOND_SM,
  CARD_SHELL,
} from "./publicCardStyles";

export function PublicDocumentCard({
  icon: Icon,
  badge = "PDF",
  title,
  description,
  actionLabel,
  onAction,
}: {
  icon: React.ComponentType<{ className?: string; strokeWidth?: number | string }>;
  badge?: string;
  title: string;
  description: string;
  actionLabel: string;
  onAction?: () => void;
}) {
  return (
    <div className={`${CARD_SHELL} h-full w-full justify-between p-6 pt-14 pb-6`}>
      <span className="absolute top-4 left-4 inline-flex items-center rounded-md border border-blue-200/90 bg-blue-50/80 px-2 py-0.5 text-[10px] font-bold tracking-wider text-blue-700 shadow-2xs dark:border-blue-900/60 dark:bg-blue-950/40 dark:text-blue-300">
        {badge}
      </span>

      <div className={CARD_DIAMOND_SM}>
        <Icon className={`size-6 ${CARD_DIAMOND_ICON} text-gold`} strokeWidth={2.2} />
      </div>

      <div className="flex w-full flex-1 flex-col items-center">
        <h3 className="text-base font-extrabold text-[#0a2f7a] sm:text-lg dark:text-foreground">
          {title}
        </h3>

        <p className="mt-2 flex-1 text-xs leading-relaxed text-muted-foreground sm:text-sm">
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onAction}
        className="mt-6 inline-flex cursor-pointer items-center justify-center gap-2 rounded-xl bg-[#0b5cce] px-6 py-2.5 text-xs font-bold text-amber-300 shadow-[0_4px_14px_rgba(11,92,206,0.35),0_2px_0_#ffcd35] transition-all duration-300 hover:scale-[1.03] hover:brightness-110 hover:shadow-[0_6px_20px_rgba(11,92,206,0.45),0_2px_0_#ffcd35] active:scale-95 sm:text-sm"
      >
        <span>{actionLabel}</span>
        <ArrowRightIcon className="size-4 text-amber-300 rtl:rotate-180" />
      </button>
    </div>
  );
}

