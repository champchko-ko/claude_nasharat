"use client";

import { useTranslations } from "next-intl";
import { InstagramIcon } from "./InstagramIcon";

export function PublicInstagramLink({
  url = "https://www.instagram.com/alfirdous_sc/",
}: {
  url?: string | null;
}) {
  const t = useTranslations("home");
  const href = url || "https://www.instagram.com/alfirdous_sc/";

  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("instagramLabel")}
      className="inline-flex size-9 shrink-0 items-center justify-center rounded-xl transition-transform duration-200 hover:scale-110 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
      title={t("instagramLabel")}
    >
      <InstagramIcon className="size-8.5 rounded-xl shadow-xs" />
    </a>
  );
}
