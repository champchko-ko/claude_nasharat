export interface PublicCalendarCategoryStyle {
  labelAr: string;
  labelEn: string;
  pillClass: string;
  dotClass: string;
}

export function getPublicCalendarCategoryStyle(category?: string | null): PublicCalendarCategoryStyle {
  switch (category) {
    case "exam":
      return {
        labelAr: "امتحانات عامة",
        labelEn: "General Exams",
        pillClass: "bg-purple-50 text-purple-700 border border-purple-200/60 dark:bg-purple-950/40 dark:text-purple-300",
        dotClass: "bg-purple-600",
      };
    case "academic":
      return {
        labelAr: "جدول أكاديمي",
        labelEn: "Academic Schedule",
        pillClass: "bg-indigo-50 text-indigo-700 border border-indigo-200/60 dark:bg-indigo-950/40 dark:text-indigo-300",
        dotClass: "bg-purple-600",
      };
    case "meeting":
      return {
        labelAr: "اجتماع إداري",
        labelEn: "Admin Meeting",
        pillClass: "bg-amber-50 text-amber-800 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300",
        dotClass: "bg-amber-500",
      };
    case "bulletin":
    case "circular":
      return {
        labelAr: "نشرة عامة",
        labelEn: "Public Bulletin",
        pillClass: "bg-teal-50 text-teal-800 border border-teal-200/60 dark:bg-teal-950/40 dark:text-teal-300",
        dotClass: "bg-teal-600",
      };
    default:
      return {
        labelAr: "فعالية عامة",
        labelEn: "General Event",
        pillClass: "bg-sky-50 text-sky-700 border border-sky-200/60 dark:bg-sky-950/40 dark:text-sky-300",
        dotClass: "bg-sky-500",
      };
  }
}

