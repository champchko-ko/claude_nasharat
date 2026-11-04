import type { Metadata, Viewport } from "next";
import { Geist_Mono, Tajawal } from "next/font/google";
import { notFound } from "next/navigation";
import { hasLocale, NextIntlClientProvider } from "next-intl";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ThemeProvider } from "@/components/theme";
import { ServiceWorkerRegister, PwaInstallBanner } from "@/components/pwa";
import { MessageBoxHost } from "@/components/ui/MessageBoxHost";
import { UnderConstructionView } from "@/components/public/UnderConstructionView";
import { isUnderConstruction } from "@/lib/env/isUnderConstruction";
import { routing } from "@/i18n";
import en from "../../messages/en.json";
import ar from "../../messages/ar.json";
import "../globals.css";

const fontSans = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["400", "500", "700", "800"],
  variable: "--font-sans",
  display: "swap",
});

const fontHeading = Tajawal({
  subsets: ["arabic", "latin"],
  weight: ["700", "800"],
  variable: "--font-heading",
  display: "swap",
});

const fontMono = Geist_Mono({
  variable: "--font-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#09090b" },
  ],
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "home" });
  return {
    title: t("title"),
    description: t("subtitle"),
    manifest: "/manifest.json",
    icons: {
      icon: [
        { url: "/favicon.ico", sizes: "32x32" },
        { url: "/icons/icon.svg", type: "image/svg+xml" },
        { url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" },
        { url: "/icons/icon-512x512.png", sizes: "512x512", type: "image/png" },
      ],
      apple: [{ url: "/icons/icon-192x192.png", sizes: "192x192", type: "image/png" }],
    },
    appleWebApp: {
      capable: true,
      statusBarStyle: "default",
      title: "School Portal",
    },
  };
}

export function generateStaticParams() {
  return routing.locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  if (!hasLocale(routing.locales, locale)) notFound();
  setRequestLocale(locale);
  const underConstruction = await isUnderConstruction();

  return (
    <html
      lang={locale}
      dir={locale === "ar" ? "rtl" : "ltr"}
      className={`${fontSans.variable} ${fontHeading.variable} ${fontMono.variable} h-full font-sans antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <ThemeProvider
          attribute="class"
          defaultTheme="moe"
          themes={["moe", "al-nada", "light", "dark", "emerald", "midnight"]}
          enableSystem={false}
          disableTransitionOnChange
        >
          <NextIntlClientProvider messages={locale === "ar" ? ar : en}>
            {underConstruction ? <UnderConstructionView /> : children}
            <MessageBoxHost />
            <PwaInstallBanner />
            <ServiceWorkerRegister />
          </NextIntlClientProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
