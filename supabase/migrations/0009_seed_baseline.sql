-- 0009: Reference data that every deployment needs.
-- Deliberately NOT seeded: role permission grants. The owner chooses every
-- role's permissions. Only the locked `owner` role holds everything, and it does
-- so implicitly (no rows).

insert into public.permissions (key, category, name_ar, name_en, sort_order) values
  ('circular.create', 'circulars', 'إنشاء التعاميم', 'Create Circulars', 10),
  ('circular.publish', 'circulars', 'نشر التعاميم', 'Publish Circulars', 20),
  ('circular.assign', 'circulars', 'توجيه وتعيين التعاميم', 'Assign Circulars', 30),
  ('circular.respond', 'circulars', 'الرد على التعاميم', 'Respond to Circulars', 40),
  ('circular.view_responses', 'circulars', 'عرض ردود التعاميم', 'View Circular Responses', 50),
  ('maintenance.create', 'maintenance', 'إنشاء طلبات الصيانة', 'Create Maintenance Requests', 60),
  ('maintenance.assign', 'maintenance', 'تعيين الفنيين للصيانة', 'Assign Maintenance Techs', 70),
  ('maintenance.update', 'maintenance', 'تحديث حالة الصيانة', 'Update Maintenance Status', 80),
  ('maintenance.close', 'maintenance', 'إغلاق طلبات الصيانة', 'Close Maintenance Requests', 90),
  ('calendar.manage', 'calendar', 'إدارة الفعاليات والتقويم', 'Manage School Calendar', 100),
  ('settings.school.update', 'settings', 'تحديث بيانات المدرسة', 'Update School Settings', 110),
  ('settings.platform.update', 'settings', 'إدارة إعدادات المنصة', 'Manage Platform Settings', 120),
  ('users.manage', 'administration', 'إدارة حسابات المستخدمين', 'Manage Users', 130),
  ('roles.manage', 'administration', 'إدارة الأدوار والصلاحيات', 'Manage Roles & Permissions', 140),
  ('reports.view', 'reporting', 'عرض وتصدير التقارير', 'View & Export Reports', 150),
  ('audit.view', 'audit', 'الاطلاع على سجل العمليات', 'View Audit Logs', 160);

insert into public.roles (key, name_ar, name_en, is_system, is_locked, requires_department) values
  ('owner',           'مدير النظام',      'System Administrator',   true, true,  false),
  ('school_admin',    'مدير مدرسة',       'School Administrator',   true, false, false),
  ('department_head', 'رئيس قسم',         'Department Head',        true, false, true),
  ('staff',           'موظف / كادر مدرسي', 'Staff Member',           true, false, true),
  ('operator',        'فني صيانة',        'Maintenance Technician', true, false, false);

-- The single school. Placeholder names; the owner edits them in Settings.
insert into public.schools (name_ar, name_en, slug) values ('المدرسة', 'School', 'school');
insert into public.school_settings (singleton) values (true);
