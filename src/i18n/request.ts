import { hasLocale } from "next-intl";
import { getRequestConfig } from "next-intl/server";
import en from "../messages/en.json";
import ar from "../messages/ar.json";
import { routing } from "./routing";

export default getRequestConfig(async ({ requestLocale }) => {
  const requested = await requestLocale;
  const locale = hasLocale(routing.locales, requested) ? requested : routing.defaultLocale;
  return { locale, messages: locale === "ar" ? ar : en };
});
