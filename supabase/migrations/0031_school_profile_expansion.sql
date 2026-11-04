-- 0031: Expand school profile with bilingual leadership, contact, address, and narrative fields.

alter table public.schools
  add column if not exists phone text,
  add column if not exists manager_name_ar text,
  add column if not exists manager_name_en text,
  add column if not exists assistant_manager_ar text,
  add column if not exists assistant_manager_en text,
  add column if not exists assistant_manager_2_ar text,
  add column if not exists assistant_manager_2_en text,
  add column if not exists address_ar text,
  add column if not exists address_en text;

alter table public.school_settings
  add column if not exists vision_ar text,
  add column if not exists vision_en text,
  add column if not exists mission_ar text,
  add column if not exists mission_en text;

-- Backfill bilingual vision/mission from existing fields if available
update public.school_settings
set vision_ar = coalesce(vision_ar, vision),
    mission_ar = coalesce(mission_ar, mission)
where vision_ar is null or mission_ar is null;
