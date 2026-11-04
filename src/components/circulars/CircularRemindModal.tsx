"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { XIcon } from "lucide-react";
import { remindCircularAction } from "@/actions/circulars/remindCircularAction";
import { useDrawerEscape } from "@/components/layout/useDrawerEscape";
import { CircularRemindHeader } from "./CircularRemindHeader";
import { CircularRemindTargetSelector } from "./CircularRemindTargetSelector";
import { CircularRemindFooter } from "./CircularRemindFooter";

export function CircularRemindModal({
  circularId,
  circularTitle,
  open,
  onClose,
}: {
  circularId?: string | null;
  circularTitle?: string;
  open: boolean;
  onClose: () => void;
}) {
  const t = useTranslations("circulars");
  const tCommon = useTranslations("common");
  const [isPending, startTransition] = useTransition();
  const [targetType, setTargetType] = useState<"pending" | "all">("pending");
  const [customMessage, setCustomMessage] = useState("");

  useDrawerEscape(onClose, open);

  if (!open) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    startTransition(async () => {
      const res = await remindCircularAction({
        circularId,
        targetType,
        customMessage: customMessage.trim() || undefined,
      });

      if (res.success) {
        if ((res.count ?? 0) > 0) {
          toast.success(t("reminderSentSuccess", { count: res.count ?? 0 }));
        } else {
          toast.info(t("noRecipientsFound"));
        }
        onClose();
      } else {
        toast.error(res.error || "Failed to send reminder");
      }
    });
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex animate-in items-center justify-center bg-scrim/60 p-4 backdrop-blur-xs duration-200 fade-in"
    >
      <div className="relative w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          disabled={isPending}
          className="absolute end-4 top-4 text-muted-foreground hover:text-foreground"
          aria-label={tCommon("close")}
        >
          <XIcon className="size-5" />
        </button>

        <form onSubmit={handleSubmit} className="space-y-5">
          <CircularRemindHeader circularTitle={circularTitle} />

          <CircularRemindTargetSelector targetType={targetType} onChange={setTargetType} />

          <div className="space-y-1.5">
            <label htmlFor="customMessage" className="text-xs font-semibold text-foreground">
              {t("customMessageLabel")}
            </label>
            <textarea
              id="customMessage"
              rows={3}
              value={customMessage}
              onChange={(e) => setCustomMessage(e.target.value)}
              placeholder={t("customMessagePlaceholder")}
              className="w-full rounded-xl border border-border bg-background p-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
          </div>

          <CircularRemindFooter isPending={isPending} onClose={onClose} />
        </form>
      </div>
    </div>
  );
}
