-- Local development seed. Applied only by `supabase db reset` / `supabase start`
-- on your own machine. It is NEVER applied to a linked or hosted project by
-- `supabase db push`.
--
-- Demo accounts (local only). Every account uses the password `LocalDev123!`:
--   owner@local.test   owner
--   admin@local.test   school_admin
--   head@local.test    department_head of "العلوم" (Science)
--   staff@local.test   staff of "اللغة العربية" (Arabic)
--   tech@local.test    operator
--
-- The baseline seeds NO role permissions; the owner chooses them. For local
-- development this file grants the demo roles a convenient set so every screen
-- has something to show. Change them in the Roles screen like any other role.
-- Idempotent: safe to re-run.

-- 1. The school (single row, created by the baseline) and departments.
update public.schools
set name_ar = 'مدرسة الاختبار المحلية',
    name_en = 'Local Test School',
    slug = 'local-test-school';

insert into public.departments (id, name_ar, name_en, is_active) values
  ('b0000000-0000-4000-8000-000000000001', 'العلوم', 'Science', true),
  ('b0000000-0000-4000-8000-000000000002', 'اللغة العربية', 'Arabic', true),
  ('b0000000-0000-4000-8000-000000000003', 'الرياضيات', 'Mathematics', true),
  ('b0000000-0000-4000-8000-000000000004', 'التربية البدنية', 'Physical Education', true)
on conflict do nothing;

-- 2. Auth users, identities and profiles (same shape GoTrue writes).
do $$
declare
  v_user record;
  v_owner uuid := 'c0000000-0000-4000-8000-000000000001';
begin
  for v_user in
    select * from (
      values
        (v_owner, 'owner@local.test', 'مدير النظام', null::uuid, 'Application Owner'),
        ('c0000000-0000-4000-8000-000000000002'::uuid, 'admin@local.test', 'مديرة المدرسة', null::uuid, 'School Administrator'),
        ('c0000000-0000-4000-8000-000000000003'::uuid, 'head@local.test', 'رئيسة قسم العلوم',
         'b0000000-0000-4000-8000-000000000001'::uuid, 'Head of Science'),
        ('c0000000-0000-4000-8000-000000000004'::uuid, 'staff@local.test', 'معلمة اللغة العربية',
         'b0000000-0000-4000-8000-000000000002'::uuid, 'Teacher'),
        ('c0000000-0000-4000-8000-000000000005'::uuid, 'tech@local.test', 'فني الصيانة', null::uuid, 'Maintenance Technician')
    ) as t(id, email, full_name, department_id, job_title)
  loop
    insert into auth.users (
      instance_id, id, aud, role, email, encrypted_password,
      email_confirmed_at, created_at, updated_at,
      raw_app_meta_data, raw_user_meta_data,
      is_sso_user, is_anonymous,
      confirmation_token, recovery_token, email_change_token_new,
      email_change, email_change_token_current,
      phone_change, phone_change_token, reauthentication_token,
      email_change_confirm_status
    )
    values (
      '00000000-0000-0000-0000-000000000000',
      v_user.id, 'authenticated', 'authenticated', v_user.email,
      extensions.crypt('LocalDev123!', extensions.gen_salt('bf')),
      now(), now(), now(),
      '{"provider":"email","providers":["email"]}'::jsonb,
      jsonb_build_object('full_name', v_user.full_name),
      false, false,
      '', '', '', '', '', '', '', '', 0
    )
    on conflict do nothing;

    insert into auth.identities (
      provider_id, user_id, identity_data, provider, last_sign_in_at, created_at, updated_at
    )
    select
      v_user.id::text, v_user.id,
      jsonb_build_object('sub', v_user.id::text, 'email', v_user.email,
                         'email_verified', true, 'phone_verified', false),
      'email', now(), now(), now()
    where not exists (
      select 1 from auth.identities i where i.user_id = v_user.id and i.provider = 'email'
    );

    insert into public.profiles (id, full_name, email, job_title, department_id, is_active, invited_by)
    values (
      v_user.id, v_user.full_name, v_user.email, v_user.job_title, v_user.department_id, true,
      case when v_user.id = v_owner then null else v_owner end
    )
    on conflict (id) do update
      set full_name = excluded.full_name,
          email = excluded.email,
          job_title = excluded.job_title,
          department_id = excluded.department_id,
          is_active = true;
  end loop;
end $$;

-- 3. Role assignments (one role per user).
insert into public.user_role_assignments (user_id, role_id, department_id, assigned_by)
select m.user_id, r.id, m.department_id, 'c0000000-0000-4000-8000-000000000001'
from (
  values
    ('c0000000-0000-4000-8000-000000000001'::uuid, 'owner', null::uuid),
    ('c0000000-0000-4000-8000-000000000002'::uuid, 'school_admin', null::uuid),
    ('c0000000-0000-4000-8000-000000000003'::uuid, 'department_head', 'b0000000-0000-4000-8000-000000000001'::uuid),
    ('c0000000-0000-4000-8000-000000000004'::uuid, 'staff', 'b0000000-0000-4000-8000-000000000002'::uuid),
    ('c0000000-0000-4000-8000-000000000005'::uuid, 'operator', null::uuid)
) as m(user_id, role_key, department_id)
join public.roles r on r.key = m.role_key
on conflict (user_id) do nothing;

-- 4. DEMO permissions for local development only (the owner normally decides these).
insert into public.role_permissions (role_id, permission_key)
select r.id, g.permission_key
from (
  values
    ('school_admin', 'circular.create'), ('school_admin', 'circular.publish'),
    ('school_admin', 'circular.assign'), ('school_admin', 'circular.view_responses'),
    ('school_admin', 'maintenance.create'), ('school_admin', 'maintenance.assign'),
    ('school_admin', 'maintenance.update'), ('school_admin', 'maintenance.close'),
    ('school_admin', 'calendar.manage'), ('school_admin', 'settings.school.update'),
    ('school_admin', 'users.manage'), ('school_admin', 'reports.view'), ('school_admin', 'audit.view'),
    ('department_head', 'circular.respond'), ('department_head', 'maintenance.create'),
    ('staff', 'circular.respond'), ('staff', 'maintenance.create'),
    ('operator', 'maintenance.update')
) as g(role_key, permission_key)
join public.roles r on r.key = g.role_key
on conflict do nothing;

-- 5. Numbering counters so demo numbers do not clash with new documents.
insert into public.school_sequences (kind, year, next_value) values
  ('circular', date_part('year', now())::smallint, 3),
  ('maintenance', date_part('year', now())::smallint, 2)
on conflict do nothing;

-- 6. Sample content.
insert into public.circulars (
  id, ref_number, title, body, status, visibility, priority, publish_at, due_at, created_by
) values
  ('d0000000-0000-4000-8000-000000000001', 'CIR-DEMO-0001', 'بدء العام الدراسي',
   'يرجى الاطلاع على جدول بداية العام وتأكيد الاستلام.', 'published', 'internal', 'normal',
   now() - interval '3 days', now() + interval '10 days', 'c0000000-0000-4000-8000-000000000002'),
  ('d0000000-0000-4000-8000-000000000002', 'CIR-DEMO-0002', 'اجتماع قسم العلوم',
   'اجتماع تنسيقي لقسم العلوم يوم الأحد.', 'published', 'internal', 'high',
   now() - interval '1 day', now() + interval '5 days', 'c0000000-0000-4000-8000-000000000002'),
  ('d0000000-0000-4000-8000-000000000003', 'CIR-DEMO-0003', 'إعلان عام: موعد اليوم المفتوح',
   'يسعدنا دعوتكم لحضور اليوم المفتوح.', 'published', 'public', 'normal',
   now() - interval '2 days', now() + interval '20 days', 'c0000000-0000-4000-8000-000000000002')
on conflict do nothing;

insert into public.circular_targets (circular_id, department_id)
select 'd0000000-0000-4000-8000-000000000001', d.id from public.departments d
union all
select 'd0000000-0000-4000-8000-000000000002', 'b0000000-0000-4000-8000-000000000001'
on conflict do nothing;

insert into public.circular_responses (circular_id, department_id, responder_id, response_type, status, is_latest)
values ('d0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
        'c0000000-0000-4000-8000-000000000003', 'acknowledgement', 'acknowledged', true)
on conflict do nothing;

insert into public.calendar_events (id, title_ar, title_en, starts_at, ends_at, status, visibility, created_by)
values
  ('e0000000-0000-4000-8000-000000000001', 'اليوم المفتوح', 'Open Day',
   now() + interval '14 days', now() + interval '14 days', 'published', 'public',
   'c0000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-000000000002', 'اجتماع المعلمين', 'Staff Meeting',
   now() + interval '3 days', now() + interval '3 days', 'published', 'internal',
   'c0000000-0000-4000-8000-000000000002')
on conflict do nothing;

insert into public.maintenance_requests (id, ticket_number, title, description, reporter_id, priority)
values ('f0000000-0000-4000-8000-000000000001', 'MR-DEMO-0001', 'مصباح تالف في الفصل',
        'المصباح في الفصل الثالث لا يعمل.', 'c0000000-0000-4000-8000-000000000004', 'medium')
on conflict do nothing;
