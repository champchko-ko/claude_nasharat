-- 0014: FK hardening surfaced by the RLS battery: actor/reference links to
-- profiles must not block user deletion — the audit rows survive with nulls.

alter table public.audit_logs
  drop constraint audit_logs_actor_id_fkey,
  add constraint audit_logs_actor_id_fkey
    foreign key (actor_id) references public.profiles(id) on delete set null;

alter table public.user_role_assignments
  drop constraint user_role_assignments_assigned_by_fkey,
  add constraint user_role_assignments_assigned_by_fkey
    foreign key (assigned_by) references public.profiles(id) on delete set null;

alter table public.profiles
  drop constraint profiles_invited_by_fkey,
  add constraint profiles_invited_by_fkey
    foreign key (invited_by) references public.profiles(id) on delete set null;
