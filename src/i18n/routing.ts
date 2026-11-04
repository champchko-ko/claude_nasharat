import { defineRouting } from "next-intl/routing";

export const routing = defineRouting({
  locales: ["ar", "en"],
  defaultLocale: "ar",
  localePrefix: "as-needed",
  // Arabic-first (D2): `/` always serves Arabic. No Accept-Language or
  // NEXT_LOCALE cookie negotiation — English is reached explicitly via /en.
  localeDetection: false,
});
