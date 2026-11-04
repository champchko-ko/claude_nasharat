-- Phase 1: no demo data yet.
-- The previous seed inserted multi-tenant rows (schools.timezone, school_id on
-- every table) and no longer matches the schema. The demo users and demo role
-- grants are rewritten in Phase 2, together with the policies they exercise.
-- This file exists so `supabase db reset` completes.
select 1;
