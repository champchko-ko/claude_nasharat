"use client";

import { useActionState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { loginAction } from "@/actions/auth/loginAction";
import { Link, useRouter } from "@/i18n";
import { AUTH_BUTTON, AUTH_INPUT } from "@/components/ui/auth-styles";

export function LoginForm() {
  const t = useTranslations("auth");
  const tErrors = useTranslations("errors");
  const [state, formAction, pending] = useActionState(loginAction, {
    ok: false,
    error: null,
  });
  const router = useRouter();

  useEffect(() => {
    if (state.ok) router.push("/dashboard");
  }, [state.ok, router]);

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
          className={AUTH_INPUT}
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        {t("passwordLabel")}
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="current-password"
          dir="ltr"
          className={AUTH_INPUT}
        />
      </label>
      <div className="flex justify-end">
        <Link
          href="/forgot-password"
          className="text-xs text-muted-foreground hover:text-foreground hover:underline"
        >
          {t("forgotPassword")}
        </Link>
      </div>
      {state.error ? (
        <p className="text-sm text-destructive">
          {state.error === "disabled"
            ? t("disabled")
            : state.error === "rate_limited"
              ? tErrors("rateLimitedDesc")
              : t("error")}
        </p>
      ) : null}
      <button type="submit" disabled={pending} className={AUTH_BUTTON}>
        {t("signIn")}
      </button>
    </form>
  );
}
