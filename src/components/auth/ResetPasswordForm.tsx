"use client";

import { useActionState } from "react";
import { useTranslations } from "next-intl";
import { CheckCircle2Icon, Loader2Icon } from "lucide-react";
import { Link } from "@/i18n";
import { resetPasswordAction } from "@/actions/auth/resetPasswordAction";
import { AUTH_BUTTON, AUTH_INPUT } from "@/components/ui/auth-styles";

export function ResetPasswordForm() {
  const t = useTranslations("auth");
  const [state, formAction, pending] = useActionState(resetPasswordAction, {
    success: false,
    error: null,
  });

  if (state.success) {
    return (
      <div className="flex w-full max-w-sm flex-col items-center gap-4 text-center">
        <div className="flex size-12 items-center justify-center rounded-full bg-primary/10 text-primary">
          <CheckCircle2Icon className="size-6" />
        </div>
        <p className="text-sm font-medium text-foreground">{t("passwordResetSuccess")}</p>
        <Link
          href="/login"
          className="mt-2 inline-flex h-9 w-full items-center justify-center rounded-md bg-primary text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("signIn")}
        </Link>
      </div>
    );
  }

  const errorMessage =
    state.error === "tooShort"
      ? t("passwordTooShort")
      : state.error === "mismatch"
        ? t("passwordsDoNotMatch")
        : state.error
          ? t("error")
          : null;

  return (
    <form action={formAction} className="flex w-full max-w-sm flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        {t("newPasswordLabel")}
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          dir="ltr"
          className={AUTH_INPUT}
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        {t("confirmPasswordLabel")}
        <input
          name="confirm_password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          dir="ltr"
          className={AUTH_INPUT}
        />
      </label>

      {errorMessage && <p className="text-sm text-destructive">{errorMessage}</p>}

      <button type="submit" disabled={pending} className={AUTH_BUTTON}>
        {pending && <Loader2Icon className="size-4 animate-spin" />}
        <span>{pending ? t("sending") : t("saveNewPassword")}</span>
      </button>
    </form>
  );
}
