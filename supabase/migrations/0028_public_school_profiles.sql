-- 0028: Give the public school profile a data path (finding N6).
--
-- schools_select and school_settings_select are authenticated-only, so the
-- public profile pages required by §5.3/6 (overview, vision, mission, contact)
-- had no anonymous source. Rather than widen those tables — school_settings also
-- carries policies and notification preferences — expose a curated, read-only
-- view of just the public fields.
--
-- The view runs with the owner's rights (security_invoker = false), which is
-- exactly why it can serve anon: it is the sole anonymous read path and it lists
-- only active schools and non-sensitive columns.

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
  ss.objectives
from public.schools s
left join public.school_settings ss on ss.school_id = s.id
where s.is_active;

revoke all on public.public_school_profiles from public;
grant select on public.public_school_profiles to anon, authenticated;
