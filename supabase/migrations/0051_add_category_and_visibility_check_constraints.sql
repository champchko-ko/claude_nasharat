-- 0051: Add CHECK constraints on category and visibility text columns (FI-21).
--
-- Prevents arbitrary unvalidated strings from being stored and causing missing
-- translation keys or invalid assumptions down the road.

alter table public.maintenance_requests
  drop constraint if exists maintenance_requests_category_check;
alter table public.maintenance_requests
  add constraint maintenance_requests_category_check
  check (category in ('electrical', 'plumbing', 'hvac', 'carpentry', 'cleaning', 'it', 'safety', 'other'));

alter table public.circulars
  drop constraint if exists circulars_category_check;
alter table public.circulars
  add constraint circulars_category_check
  check (category in ('general', 'administrative', 'academic', 'financial', 'activities', 'other'));

alter table public.calendar_events
  drop constraint if exists calendar_events_category_check;
alter table public.calendar_events
  add constraint calendar_events_category_check
  check (category in ('event', 'academic', 'exam', 'holiday', 'meeting', 'activity', 'other'));

alter table public.school_achievements
  drop constraint if exists school_achievements_category_check;
alter table public.school_achievements
  add constraint school_achievements_category_check
  check (category in ('academic', 'competition', 'sports', 'scientific', 'community', 'other'));

alter table public.school_achievements
  drop constraint if exists school_achievements_visibility_check;
alter table public.school_achievements
  add constraint school_achievements_visibility_check
  check (visibility in ('public', 'internal'));

