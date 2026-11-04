export type PermissionCatalogItem = {
  key: string;
  category:
    | "circulars"
    | "maintenance"
    | "calendar"
    | "settings"
    | "administration"
    | "reporting"
    | "audit";
  name_ar: string;
  name_en: string;
};

export const PERMISSION_CATALOG: PermissionCatalogItem[] = [
  {
    key: "circular.create",
    category: "circulars",
    name_ar: "إنشاء التعاميم",
    name_en: "Create Circulars",
  },
  {
    key: "circular.publish",
    category: "circulars",
    name_ar: "نشر التعاميم",
    name_en: "Publish Circulars",
  },
  {
    key: "circular.assign",
    category: "circulars",
    name_ar: "توجيه وتعيين التعاميم",
    name_en: "Assign Circulars",
  },
  {
    key: "circular.respond",
    category: "circulars",
    name_ar: "الرد على التعاميم",
    name_en: "Respond to Circulars",
  },
  {
    key: "circular.view_responses",
    category: "circulars",
    name_ar: "عرض ردود التعاميم",
    name_en: "View Circular Responses",
  },
  {
    key: "maintenance.create",
    category: "maintenance",
    name_ar: "إنشاء طلبات الصيانة",
    name_en: "Create Maintenance Requests",
  },
  {
    key: "maintenance.assign",
    category: "maintenance",
    name_ar: "تعيين الفنيين للصيانة",
    name_en: "Assign Maintenance Techs",
  },
  {
    key: "maintenance.update",
    category: "maintenance",
    name_ar: "تحديث حالة الصيانة",
    name_en: "Update Maintenance Status",
  },
  {
    key: "maintenance.close",
    category: "maintenance",
    name_ar: "إغلاق طلبات الصيانة",
    name_en: "Close Maintenance Requests",
  },
  {
    key: "calendar.manage",
    category: "calendar",
    name_ar: "إدارة الفعاليات والتقويم",
    name_en: "Manage School Calendar",
  },
  {
    key: "settings.school.update",
    category: "settings",
    name_ar: "تحديث بيانات المدرسة",
    name_en: "Update School Settings",
  },
  {
    key: "settings.platform.update",
    category: "settings",
    name_ar: "إدارة إعدادات المنصة",
    name_en: "Manage Platform Settings",
  },
  {
    key: "users.manage",
    category: "administration",
    name_ar: "إدارة حسابات المستخدمين",
    name_en: "Manage Users",
  },
  {
    key: "roles.manage",
    category: "administration",
    name_ar: "إدارة الأدوار والصلاحيات",
    name_en: "Manage Roles & Permissions",
  },
  {
    key: "reports.view",
    category: "reporting",
    name_ar: "عرض وتصدير التقارير",
    name_en: "View & Export Reports",
  },
  {
    key: "audit.view",
    category: "audit",
    name_ar: "الاطلاع على سجل العمليات",
    name_en: "View Audit Logs",
  },
];
