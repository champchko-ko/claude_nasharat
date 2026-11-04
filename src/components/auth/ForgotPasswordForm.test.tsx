import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { ForgotPasswordForm } from "./ForgotPasswordForm";

afterEach(() => {
  cleanup();
});

vi.mock("@/actions/auth/requestPasswordResetAction", () => ({
  requestPasswordResetAction: vi.fn(),
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
    email: "البريد الإلكتروني",
    sendResetLink: "إرسال رابط الاستعادة",
    sending: "جاري الإرسال...",
    resetLinkSent: "تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.",
    backToSignIn: "العودة لتسجيل الدخول",
    error: "حدث خطأ غير متوقع",
  },
};

describe("ForgotPasswordForm", () => {
  it("renders email input and submit button", () => {
    render(
      <NextIntlClientProvider locale="ar" messages={messages}>
        <ForgotPasswordForm />
      </NextIntlClientProvider>,
    );

    const emailInput = screen.getByPlaceholderText("user@example.com");
    expect(emailInput).toBeInTheDocument();
    expect(emailInput).toHaveAttribute("type", "email");

    const submitBtn = screen.getByRole("button", { name: "إرسال رابط الاستعادة" });
    expect(submitBtn).toBeInTheDocument();
  });
});
