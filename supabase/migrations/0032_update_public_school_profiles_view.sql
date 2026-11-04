-- 0032: Update public_school_profiles view to include all expanded school profile fields.
--
-- `CREATE OR REPLACE VIEW` may only APPEND columns: the existing column names
-- and their order must be preserved. Listing the new columns in the middle
-- (as this migration originally did) made Postgres reject the statement with
-- `cannot change name of view column "public_description" to "phone"`, so the
-- view was never updated and every column the application reads (`phone`,
-- `manager_name_ar`, `vision_ar`, ...) was missing from it — the public school
-- profile page failed with HTTP 400 `column public_school_profiles.phone does
-- not exist` (verified against the local stack).
--
-- The original ten columns therefore stay first, in their original order, and
-- the new ones are appended. PostgREST resolves the view's columns by name, so
-- the append order does not affect the application's queries.
create or replace view public.public_school_profiles
with (security_invoker = false) as
select
  s.id,
  s.name_ar,
  s.name_en,
  s.slug,
  s.logo_path,
  s.timezone,
  ss.public_description,
  ss.vision,
  ss.mission,
  ss.objectives,
  -- Appended in 0032.
  s.phone,
  s.manager_name_ar,
  s.manager_name_en,
  s.assistant_manager_ar,
  s.assistant_manager_en,
  s.assistant_manager_2_ar,
  s.assistant_manager_2_en,
  s.address_ar,
  s.address_en,
  ss.academic_year,
  ss.vision_ar,
  ss.vision_en,
  ss.mission_ar,
  ss.mission_en
from public.schools s
left join public.school_settings ss on ss.school_id = s.id
where s.is_active;

revoke all on public.public_school_profiles from public;
grant select on public.public_school_profiles to anon, authenticated;
