import { formatSchoolDate } from "@/lib/school/formatSchoolDate";

export function formatCircularDate(
  dateInput?: string | null,
  locale = "ar",
  dateFormat?: string | null,
): string {
  if (!dateInput) return "—";
  if (dateFormat) {
    return formatSchoolDate(dateInput, dateFormat);
  }

  const date = new Date(dateInput);
  if (Number.isNaN(date.getTime())) return "—";

  return date.toLocaleDateString(locale === "ar" ? "ar-EG" : "en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}
