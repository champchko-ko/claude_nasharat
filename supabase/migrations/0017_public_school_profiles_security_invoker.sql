-- 0017: make the public profile view honor the caller's privileges and RLS.
-- The view exposes only intentionally public profile fields. Keep the base
-- tables restricted to those same columns for anonymous callers.

alter view public.public_school_profiles
set (security_invoker = true);

create policy schools_public_profile_anon_select on public.schools
  for select to anon
  using (is_active);

create policy school_settings_public_profile_anon_select on public.school_settings
  for select to anon
  using (true);

grant select (
  singleton,
  id,
  name_ar,
  name_en,
  slug,
  logo_path,
  is_active,
  phone,
  manager_name_ar,
  manager_name_en,
  assistant_manager_ar,
  assistant_manager_en,
  assistant_manager_2_ar,
  assistant_manager_2_en,
  address_ar,
  address_en,
  email
) on public.schools to anon;

grant select (
  singleton,
  public_description,
  vision,
  mission,
  objectives,
  academic_year,
  vision_ar,
  vision_en,
  mission_ar,
  mission_en
) on public.school_settings to anon;
