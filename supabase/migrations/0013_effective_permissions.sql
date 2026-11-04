-- 0013: Convenience RPC for the app — the caller's effective permission keys.
create or replace function public.effective_permission_keys()
returns setof text
language sql
stable
security definer
set search_path = public
as $$
  select distinct rp.permission_key
  from public.user_role_assignments ura
  join public.role_permissions rp on rp.role_id = ura.role_id
  join public.profiles p on p.id = ura.user_id
  where ura.user_id = auth.uid()
    and p.is_active
$$;
