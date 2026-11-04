import type { ActivityItem } from "./NewDashboardActivityList";
import type { CircularRow } from "@/lib/circulars/types";
import type { MaintenanceRequestRow } from "@/lib/maintenance/types";
import type { SchoolAchievementRow } from "@/lib/achievements/types";

function buildCircularActivity(circ?: CircularRow): ActivityItem {
  return {
    id: "a1",
    text: circ ? circ.title : "جدول المناوبة المدرسية والإشراف",
    time: "منشور لجميع الأقسام",
    desc: "تم اعتماد ونشر التعميم الإداري لضمان انضباط وسلامة الطالبات في كافة أرجاء المدرسة.",
    icon: "/assets/dashboard/act_1.png",
    cy: 361,
    bg: "#e4edfc",
  };
}

function buildMaintenanceActivity(mnt?: MaintenanceRequestRow): ActivityItem {
  const ticket = mnt ? mnt.ticket_number : "MNT-2026-001";
  const desc = mnt
    ? mnt.description
    : "عطل في وحدات التكييف المركزية بالصالة الرياضية - تم تكليف الفني المختص.";
  return {
    id: "a2",
    text: mnt ? mnt.title : "بلاغ عاجل: صيانة وحدات التكييف",
    time: `${ticket} · قيد المعالجة`,
    desc,
    icon: "/assets/dashboard/act_2.png",
    cy: 403,
    bg: "#fdeedb",
  };
}

function buildAchievementActivity(ach?: SchoolAchievementRow): ActivityItem {
  const desc = ach?.description
    ? ach.description
    : "فوز فريق المدرسة بالمركز الأول في مسابقة الروبوت والذكاء الاصطناعي.";
  return {
    id: "a3",
    text: ach ? ach.title_ar : "المركز الأول في الأولمبياد الوطني للروبوت",
    time: "إنجاز معتمد وموثق",
    desc,
    icon: "/assets/dashboard/act_3.png",
    cy: 447,
    bg: "#e3f3e8",
  };
}

export function buildDashboardActivityItems(
  circulars: CircularRow[],
  maintenance: MaintenanceRequestRow[],
  achievements: SchoolAchievementRow[],
): ActivityItem[] {
  return [
    buildCircularActivity(circulars[0]),
    buildMaintenanceActivity(maintenance[0]),
    buildAchievementActivity(achievements[0]),
  ];
}
