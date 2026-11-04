-- Local development seed. Never applied to a linked/remote project: the
-- Supabase CLI only runs this file on `supabase db reset` / `supabase start`.
--
-- Creates one demo school with four departments, four sign-in-capable users,
-- three published circulars (one of them addressed to every department), a
-- pair of targets and a single acknowledgement, so the dashboard compliance
-- chart has a realistic mix of 100%, partial and 0% departments.
--
-- Credentials (local only): every account uses the password `LocalDev123!`
--   owner@local.test          platform owner (global assignment)
--   admin@local.test          school_admin
--   head@local.test           department_head of "العلوم"
--   staff@local.test          staff of "اللغة العربية"
--
-- Every statement is idempotent so the file can be re-run against a database
-- that already holds the demo rows.

-- ---------------------------------------------------------------------------
-- 1. School and departments
-- ---------------------------------------------------------------------------
insert into public.schools (id, name_ar, name_en, slug, timezone, is_active)
values (
  'a0000000-0000-4000-8000-000000000001',
  'مدرسة الاختبار المحلية',
  'Local Test School',
  'local-test-school',
  'Asia/Riyadh',
  true
)
on conflict do nothing;

insert into public.departments (id, school_id, name_ar, name_en, is_active)
values
  ('b0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001', 'العلوم', 'Science', true),
  ('b0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001', 'اللغة العربية', 'Arabic', true),
  ('b0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001', 'الرياضيات', 'Mathematics', true),
  ('b0000000-0000-4000-8000-000000000004', 'a0000000-0000-4000-8000-000000000001', 'التربية البدنية', 'Physical Education', true)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- 2. Auth users + identities + profiles
--    Mirrors the proven pattern in 0042_restore_backup_transactional.sql, with
--    a bcrypt password so the accounts can actually sign in.
-- ---------------------------------------------------------------------------
do $$
declare
  v_user record;
  v_owner uuid := 'c0000000-0000-4000-8000-000000000001';
begin
  for v_user in
    select * from (
      values
        (v_owner, 'owner@local.test', 'مدير النظام', null::uuid),
        ('c0000000-0000-4000-8000-000000000002', 'admin@local.test', 'مديرة المدرسة',
         null::uuid),
        ('c0000000-0000-4000-8000-000000000003', 'head@local.test', 'رئيسة قسم العلوم',
         'b0000000-0000-4000-8000-000000000001'::uuid),
        ('c0000000-0000-4000-8000-000000000004', 'staff@local.test', 'معلمة اللغة العربية',
         'b0000000-0000-4000-8000-000000000002'::uuid)
    ) as t(id, email, full_name, department_id)
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
      v_user.id::text,
      v_user.id,
      jsonb_build_object(
        'sub', v_user.id::text,
        'email', v_user.email,
        'email_verified', true,
        'phone_verified', false
      ),
      'email', now(), now(), now()
    where not exists (
      select 1 from auth.identities i where i.user_id = v_user.id and i.provider = 'email'
    );

    insert into public.profiles (
      id, full_name, email, job_title, department_id, school_id, is_active, invited_by
    )
    values (
      v_user.id,
      v_user.full_name,
      v_user.email,
      case
        when v_user.id = v_owner then 'Application Owner'
        when v_user.email = 'admin@local.test' then 'School Administrator'
        when v_user.email = 'head@local.test' then 'Head of Science'
        else 'Teacher'
      end,
      v_user.department_id,
      'a0000000-0000-4000-8000-000000000001'::uuid,
      true,
      case when v_user.id = v_owner then null else v_owner end
    )
    on conflict (id) do update
      set full_name = excluded.full_name,
          email = excluded.email,
          job_title = excluded.job_title,
          department_id = excluded.department_id,
          school_id = excluded.school_id,
          is_active = true;
  end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 3. Role assignments
--    owner       -> global (school_id null), which is how is_platform_owner works
--    school_admin-> school scope
--    head/staff  -> department scope
-- ---------------------------------------------------------------------------
insert into public.user_role_assignments (user_id, role_id, school_id, department_id, assigned_by)
select m.user_id, r.id, m.school_id, m.department_id, 'c0000000-0000-4000-8000-000000000001'
from (
  values
    ('c0000000-0000-4000-8000-000000000001'::uuid, 'owner'::text,
     null::uuid, null::uuid),
    -- is_school_member() only counts school-scoped assignments, so the platform
    -- owner also needs a role in the school they administer (production has this
    -- same shape: global owner + school_admin). Without it every
    -- membership-gated read (departments, circular targets) returns nothing and
    -- the compliance widget renders "no data" despite full permissions.
    ('c0000000-0000-4000-8000-000000000001'::uuid, 'school_admin',
     'a0000000-0000-4000-8000-000000000001'::uuid, null::uuid),
    ('c0000000-0000-4000-8000-000000000002'::uuid, 'school_admin',
     'a0000000-0000-4000-8000-000000000001'::uuid, null::uuid),
    ('c0000000-0000-4000-8000-000000000003'::uuid, 'department_head',
     'a0000000-0000-4000-8000-000000000001'::uuid, 'b0000000-0000-4000-8000-000000000001'::uuid),
    ('c0000000-0000-4000-8000-000000000004'::uuid, 'staff',
     'a0000000-0000-4000-8000-000000000001'::uuid, 'b0000000-0000-4000-8000-000000000002'::uuid)
) as m(user_id, role_key, school_id, department_id)
join public.roles r on r.key = m.role_key and r.school_id is null
where not exists (
  select 1
  from public.user_role_assignments ura
  where ura.user_id = m.user_id
    and ura.role_id = r.id
    and ura.school_id is not distinct from m.school_id
);

-- ---------------------------------------------------------------------------
-- 4. Circulars, targets and one response
--    CIR-LOCAL-001 has no target rows, which the report layer reads as
--    "addressed to every active department" (four required responses).
-- ---------------------------------------------------------------------------
insert into public.circulars (
  id, school_id, ref_number, title, body, category, priority, status,
  response_type, publish_at, due_at, created_by
)
values
  (
    'd0000000-0000-4000-8000-000000000001', 'a0000000-0000-4000-8000-000000000001',
    'CIR-LOCAL-001', 'تعميم عام ببداية الفصل',
    'يرجى الاطلاع على الترتيبات العامة لبداية الفصل الدراسي والالتزام بها.',
    'general', 'normal', 'published', 'acknowledgement',
    now() - interval '10 days', now() + interval '5 days',
    'c0000000-0000-4000-8000-000000000001'
  ),
  (
    'd0000000-0000-4000-8000-000000000002', 'a0000000-0000-4000-8000-000000000001',
    'CIR-LOCAL-002', 'آلية رصد الدرجات',
    'على قسمي العلوم واللغة العربية اعتماد آلية رصد الدرجات قبل نهاية الأسبوع.',
    'academic', 'high', 'published', 'acknowledgement',
    now() - interval '6 days', now() + interval '2 days',
    'c0000000-0000-4000-8000-000000000001'
  ),
  (
    'd0000000-0000-4000-8000-000000000003', 'a0000000-0000-4000-8000-000000000001',
    'CIR-LOCAL-003', 'جرد عهدة المختبر',
    'على قسم الرياضيات إرفاق نتيجة جرد عهدة المختبر.',
    'administrative', 'normal', 'published', 'acknowledgement',
    now() - interval '9 days', now() - interval '2 days',
    'c0000000-0000-4000-8000-000000000001'
  )on conflict do nothing;

insert into public.circular_targets (id, circular_id, school_id, department_id)
values
  ('e0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002',
   'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001'),
  ('e0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002',
   'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002'),
  ('e0000000-0000-4000-8000-000000000003', 'd0000000-0000-4000-8000-000000000003',
   'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000003')
on conflict do nothing;

insert into public.circular_responses (
  id, circular_id, school_id, department_id, responder_id, response_type,
  status, is_latest, submitted_at
)
values (
  'f0000000-0000-4000-8000-000000000001', 'd0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000001',
  'c0000000-0000-4000-8000-000000000003', 'acknowledgement',
  'acknowledged', true, now() - interval '4 days'
),
(
  -- `not_applicable` removes this target from the denominator instead of
  -- leaving it pending forever.
  'f0000000-0000-4000-8000-000000000002', 'd0000000-0000-4000-8000-000000000002',
  'a0000000-0000-4000-8000-000000000001', 'b0000000-0000-4000-8000-000000000002',
  'c0000000-0000-4000-8000-000000000004', 'acknowledgement',
  'not_applicable', true, now() - interval '3 days'
)
on conflict do nothing;
