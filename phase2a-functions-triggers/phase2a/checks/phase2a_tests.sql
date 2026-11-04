-- Phase 2a behaviour tests. Run in the Supabase SQL Editor AFTER applying 0010-0013.
-- Everything happens inside a transaction that is rolled back at the end, so no
-- data is left behind. Any failed expectation raises an error starting "FAILED".
begin;

create or replace function pg_temp.act_as(u uuid) returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims',
    case when u is null then '' else json_build_object('sub', u, 'role', 'authenticated')::text end, true);
  perform set_config('request.jwt.claim.sub', coalesce(u::text, ''), true);
end $$;

create or replace function pg_temp.expect(cond boolean, msg text) returns void language plpgsql as $$
begin
  if not coalesce(cond, false) then raise exception 'FAILED: %', msg; end if;
end $$;

create or replace function pg_temp.expect_error(stmt text, msg text) returns void language plpgsql as $$
begin
  begin
    execute stmt;
  exception when others then
    return;
  end;
  raise exception 'FAILED (no error raised): %', msg;
end $$;

do $$
declare
  u_owner uuid := gen_random_uuid();
  u_admin uuid := gen_random_uuid();
  u_teacher uuid := gen_random_uuid();
  u_new uuid := gen_random_uuid();
  u_elec uuid := gen_random_uuid();
  dept_a uuid; dept_b uuid;
  r_owner uuid; r_admin uuid; r_staff uuid; r_custom uuid;
  n_before integer; first_no text; second_no text;
begin
  -- Structure
  perform pg_temp.expect((select count(*) from pg_proc p join pg_namespace s on s.oid = p.pronamespace
    where s.nspname = 'public' and p.proname in ('has_permission','effective_permission_keys','is_platform_owner',
      'is_circular_target','next_school_number','bootstrap_platform_owner','audit_row_change')) = 7,
    'core functions exist');

  -- Fixtures (no JWT = trusted service context)
  perform pg_temp.act_as(null);
  insert into auth.users (id, aud, role, email) values
    (u_owner, 'authenticated', 'authenticated', 't_owner_' || u_owner || '@test.local'),
    (u_admin, 'authenticated', 'authenticated', 't_admin_' || u_admin || '@test.local'),
    (u_teacher, 'authenticated', 'authenticated', 't_teacher_' || u_teacher || '@test.local'),
    (u_new, 'authenticated', 'authenticated', 't_new_' || u_new || '@test.local'),
    (u_elec, 'authenticated', 'authenticated', 't_elec_' || u_elec || '@test.local');
  insert into public.profiles (id, full_name, email) values
    (u_owner, 'Owner', 't_owner_' || u_owner || '@test.local'),
    (u_admin, 'Admin', 't_admin_' || u_admin || '@test.local'),
    (u_teacher, 'Teacher', 't_teacher_' || u_teacher || '@test.local'),
    (u_new, 'New', 't_new_' || u_new || '@test.local'),
    (u_elec, 'Elec', 't_elec_' || u_elec || '@test.local');
  insert into public.departments (name_ar, name_en) values ('أ', 'A') returning id into dept_a;
  insert into public.departments (name_ar, name_en) values ('ب', 'B') returning id into dept_b;
  select id into r_owner from public.roles where key = 'owner';
  select id into r_admin from public.roles where key = 'school_admin';
  select id into r_staff from public.roles where key = 'staff';
  insert into public.user_role_assignments (user_id, role_id) values (u_owner, r_owner), (u_admin, r_admin);
  insert into public.user_role_assignments (user_id, role_id, department_id) values (u_teacher, r_staff, dept_a);

  -- 1. Owner holds everything implicitly
  perform pg_temp.act_as(u_owner);
  perform pg_temp.expect(public.is_platform_owner(), 'owner is recognised');
  perform pg_temp.expect(public.has_permission('circular.create'), 'owner has a catalogue permission');
  perform pg_temp.expect(public.has_permission('some.future.permission'), 'owner has a permission added later');
  perform pg_temp.expect((select count(*) from public.effective_permission_keys()) = 16, 'owner sees all 16 keys');

  -- 2. Roles ship with no grants
  perform pg_temp.act_as(u_teacher);
  perform pg_temp.expect(not public.has_permission('maintenance.create'), 'staff has nothing by default');
  perform pg_temp.expect((select count(*) from public.effective_permission_keys()) = 0, 'staff has no keys');
  perform pg_temp.act_as(u_admin);
  perform pg_temp.expect(not public.has_permission('users.manage'), 'school_admin has nothing by default');

  -- 3. Owner decides; change applies immediately; department scoping
  perform pg_temp.act_as(null);
  insert into public.role_permissions (role_id, permission_key) values (r_staff, 'maintenance.create');
  perform pg_temp.act_as(u_teacher);
  perform pg_temp.expect(public.has_permission('maintenance.create'), 'grant applies immediately');
  perform pg_temp.expect(public.has_permission('maintenance.create', dept_a), 'own department allowed');
  perform pg_temp.expect(not public.has_permission('maintenance.create', dept_b), 'other department denied');
  perform pg_temp.act_as(null);
  delete from public.role_permissions where role_id = r_staff and permission_key = 'maintenance.create';
  perform pg_temp.act_as(u_teacher);
  perform pg_temp.expect(not public.has_permission('maintenance.create'), 'revocation applies immediately');

  -- 4. The owner role is locked
  perform pg_temp.act_as(null);
  perform pg_temp.expect_error(format('insert into public.role_permissions values (%L, %L)', r_owner, 'circular.create'),
    'grants on the owner role are rejected');

  -- 5. Only the owner assigns the owner role; no self edits
  perform pg_temp.act_as(u_admin);
  perform pg_temp.expect_error(format('insert into public.user_role_assignments (user_id, role_id) values (%L, %L)', u_new, r_owner),
    'a non-owner cannot assign the owner role');
  perform pg_temp.act_as(u_teacher);
  perform pg_temp.expect_error(format('update public.user_role_assignments set updated_at = now() where user_id = %L', u_teacher),
    'a user cannot edit their own assignment');

  -- 6. The last owner stays
  perform pg_temp.act_as(u_owner);
  perform pg_temp.expect_error(format('delete from public.user_role_assignments where user_id = %L', u_owner),
    'the last owner cannot be removed');
  perform pg_temp.expect_error(format('update public.profiles set is_active = false where id = %L', u_owner),
    'the last owner cannot be deactivated');

  -- 7. Roles: system roles are permanent; custom roles are free; roles with users stay
  perform pg_temp.act_as(u_owner);
  perform pg_temp.expect_error('delete from public.roles where key = ''staff''', 'system roles cannot be deleted');
  perform pg_temp.expect_error('insert into public.roles (key, name_ar, name_en, is_system) values (''x_sys'', ''x'', ''x'', true)',
    'end users cannot create system roles');
  perform pg_temp.expect_error('insert into public.roles (key, name_ar, name_en) values (''owner'', ''x'', ''x'')',
    'the owner key is reserved');
  insert into public.roles (key, name_ar, name_en) values ('electrician', 'كهربائي', 'Electrician') returning id into r_custom;
  insert into public.role_permissions (role_id, permission_key) values (r_custom, 'maintenance.update');
  insert into public.user_role_assignments (user_id, role_id) values (u_elec, r_custom);
  perform pg_temp.expect_error(format('delete from public.roles where id = %L', r_custom), 'a role with users cannot be deleted');
  perform pg_temp.act_as(u_elec);
  perform pg_temp.expect(public.has_permission('maintenance.update'), 'custom role permissions work');
  perform pg_temp.act_as(u_owner);
  delete from public.user_role_assignments where user_id = u_elec;
  delete from public.roles where id = r_custom;
  perform pg_temp.expect(not exists (select 1 from public.roles where id = r_custom), 'an empty custom role can be deleted');

  -- 8. Department-bound roles need a department
  perform pg_temp.expect_error(format('insert into public.user_role_assignments (user_id, role_id) values (%L, %L)', u_new, r_staff),
    'staff assignment without a department is rejected');

  -- 9. Profile department sync only touches department-bound roles
  perform pg_temp.act_as(null);
  update public.profiles set department_id = dept_b where id = u_teacher;
  update public.profiles set department_id = dept_a where id = u_admin;
  perform pg_temp.expect((select department_id from public.user_role_assignments where user_id = u_teacher) = dept_b,
    'teacher assignment follows the profile department');
  perform pg_temp.expect((select department_id from public.user_role_assignments where user_id = u_admin) is null,
    'school-wide assignment stays school-wide');

  -- 10. Numbering
  perform pg_temp.act_as(u_owner);
  first_no := public.next_school_number('circular');
  second_no := public.next_school_number('circular');
  perform pg_temp.expect(first_no like 'CIR-%' and second_no > first_no, 'circular numbers increase');
  perform pg_temp.expect(public.next_school_number('maintenance') like 'MR-%', 'maintenance number prefix');
  perform pg_temp.act_as(u_teacher);
  perform pg_temp.expect_error('select public.next_school_number(''circular'')', 'numbering needs circular.create');

  -- 11. Only publishers can make a circular public
  perform pg_temp.act_as(u_teacher);
  perform pg_temp.expect_error(format(
    'insert into public.circulars (ref_number, title, body, created_by, visibility) values (%L, ''t'', ''b'', %L, ''public'')',
    'T-1', u_teacher), 'a non-publisher cannot create a public circular');
  perform pg_temp.act_as(u_owner);
  insert into public.circulars (ref_number, title, body, created_by, visibility)
    values ('T-2', 't', 'b', u_owner, 'public');

  -- 12. Audit trail was written
  perform pg_temp.expect((select count(*) from public.audit_logs where entity_type in ('role_permissions', 'roles', 'user_role_assignments')) > 0,
    'role and permission changes are audited');
end $$;

select 'phase 2a behaviour tests passed' as result;
rollback;
