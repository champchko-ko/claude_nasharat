"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2Icon, ArrowLeftIcon, Loader2Icon } from "lucide-react";
import { Link } from "@/i18n";
import { requestPasswordResetAction } from "@/actions/auth/requestPasswordResetAction";
import { AUTH_BUTTON, AUTH_INPUT } from "@/components/ui/auth-styles";

export function ForgotPasswordForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const [state, formAction, pending] = useActionState(requestPasswordResetAction, {
    success: false,
    error: null,
  });

  if (state.success) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2Icon className="size-6" />
        </div>
        <p className="text-sm text-foreground">{t("resetLinkSent")}</p>
        <Link
          href="/login"
          className="mt-2 inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline"
        >
          <ArrowLeftIcon className="size-4 rtl:rotate-180" />
          <span>{t("backToSignIn")}</span>
        </Link>
      </div>
    );
  }

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {t("email")}
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          dir="ltr"
          placeholder="user@example.com"
          className={AUTH_INPUT}
        />
      </label>

      {state.error && (
        <p className="text-sm text-destructive">
          {state.error === "rate_limited" ? tErrors("rateLimitedDesc") : t("error")}
        </p>
      )}

      <button type="submit" disabled={pending} className={AUTH_BUTTON}>
        {pending && <Loader2Icon className="size-4 animate-spin" />}
        <span>{pending ? t("sending") : t("sendResetLink")}</span>
      </button>

      <div className="text-center">
        <Link
          href="/login"
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          {t("backToSignIn")}
        </Link>
      </div>
    </form>
  );
}
