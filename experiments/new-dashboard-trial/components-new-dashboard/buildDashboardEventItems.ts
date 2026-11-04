import type { DashboardEventItem } from "./NewDashboardEventList";
import type { CalendarEventRow } from "@/lib/calendar/types";

function formatEventDate(isoString: string | null | undefined, fallback: string): string {
  if (!isoString) return fallback;
  return new Date(isoString).toLocaleDateString("ar-KW");
}

function buildSingleEvent(
  ev: CalendarEventRow | undefined,
  id: string,
  defaults: { title: string; date: string; loc: string; icon: string; cy: number; bg: string },
): DashboardEventItem {
  return {
    id,
    title: ev?.title_ar ? ev.title_ar : defaults.title,
    date: formatEventDate(ev?.starts_at, defaults.date),
    loc: ev?.location ? ev.location : defaults.loc,
    icon: defaults.icon,
    cy: defaults.cy,
    bg: defaults.bg,
  };
}

export function buildDashboardEventItems(events: CalendarEventRow[]): DashboardEventItem[] {
  return [
    buildSingleEvent(events[0], "e1", {
      title: "بدء امتحانات منتصف الفصل الأول",
      date: "1 نوفمبر 2026",
      loc: "القاعات الامتحانية المجهزة",
      icon: "/assets/dashboard/ev_1.png",
      cy: 372,
      bg: "#efe6f8",
    }),
    buildSingleEvent(events[1], "e2", {
      title: "المعرض السنوي للعلوم والروبوت",
      date: "15 نوفمبر 2026",
      loc: "مسرح المدرسة الرئيسي",
      icon: "/assets/dashboard/ev_2.png",
      cy: 413,
      bg: "#e2ecfc",
    }),
    buildSingleEvent(events[2], "e3", {
      title: "اجتماع الجمعية العمومية للآباء",
      date: "20 نوفمبر 2026",
      loc: "قاعة المؤتمرات الرئيسية",
      icon: "/assets/dashboard/ev_3.png",
      cy: 455,
      bg: "#def1e3",
    }),
  ];
}
