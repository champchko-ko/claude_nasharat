-- 0016: Audit rows must survive school removal (history is kept), so the
-- school link releases on delete. Surfaced by battery cleanup runs.
alter table public.audit_logs
  drop constraint audit_logs_school_id_fkey,
  add constraint audit_logs_school_id_fkey
    foreign key (school_id) references public.schools(id) on delete set null;
