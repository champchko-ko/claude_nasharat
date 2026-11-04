import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ResetPasswordForm } from "./ResetPasswordForm";

afterEach(() => {
  cleanup();
});

vi.mock("@/actions/auth/resetPasswordAction", () => ({
  resetPasswordAction: vi.fn(),
}));

vi.mock("@/i18n", () => ({
  Link: ({ children, href, ...props }: { children: React.ReactNode; href: string }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

const messages = {
  auth: {
    newPasswordLabel: "كلمة المرور الجديدة",
    confirmPasswordLabel: "تأكيد كلمة المرور",
    saveNewPassword: "حفظ كلمة المرور الجديدة",
    sending: "جاري الإرسال...",
    passwordResetSuccess: "تمت إعادة تعيين كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.",
    signIn: "دخول",
    passwordTooShort: "يجب ألا تقل كلمة المرور عن 8 أحرف.",
    passwordsDoNotMatch: "كلمتا المرور غير متطابقتين.",
    error: "حدث خطأ غير متوقع",
  },
};

describe("ResetPasswordForm", () => {
  it("renders new password and confirm password inputs", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={messages}>
        <ResetPasswordForm />
      </NextIntlClientProvider>,
    );

    const passwordInputs = screen.getAllByLabelText(/كلمة المرور/);
    expect(passwordInputs.length).toBeGreaterThanOrEqual(2);

    const submitBtn = screen.getByRole("button", { name: "حفظ كلمة المرور الجديدة" });
    expect(submitBtn).toBeInTheDocument();
  });
});
