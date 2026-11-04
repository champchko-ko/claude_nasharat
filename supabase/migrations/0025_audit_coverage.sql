-- 0025: Close the audit-coverage gaps (findings H7/N7).
--
-- Only eight tables were audited. Structural changes (schools, departments,
-- locations) and the whole maintenance/circular-target/file-metadata surface
-- changed silently, so doc §5's "who changed what" trail had holes.
--
-- Schools are also the one audited entity whose own key is `id`, and deleting a
-- school nulls the school_id of its remaining audit rows (FK on delete set
-- null). Snapshotted names on the schools row keep attribution recoverable.

create or replace function public.audit_row_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_old jsonb;
  v_new jsonb;
  v_school uuid;
  v_entity uuid;
  v_meta jsonb;
begin
  -- Cascaded deletes (school/user removal) fire this trigger during the
  -- cascade; skip per-row auditing there to keep bulk deletions lean.
  if pg_trigger_depth() > 1 then
    if tg_op = 'DELETE' then
      return old;
    end if;
    return new;
  end if;

  v_old := case when tg_op in ('UPDATE', 'DELETE') then to_jsonb(old) end;
  v_new := case when tg_op in ('INSERT', 'UPDATE') then to_jsonb(new) end;

  -- Do not log unnecessary personal data (doc §3).
  if tg_table_name = 'profiles' then
    v_old := case when v_old is null then null else jsonb_build_object(
      'id', v_old -> 'id', 'is_active', v_old -> 'is_active',
      'school_id', v_old -> 'school_id', 'department_id', v_old -> 'department_id'
    ) end;
    v_new := case when v_new is null then null else jsonb_build_object(
      'id', v_new -> 'id', 'is_active', v_new -> 'is_active',
      'school_id', v_new -> 'school_id', 'department_id', v_new -> 'department_id'
    ) end;
  end if;

  if tg_table_name = 'schools' then
    v_school := coalesce(v_new ->> 'id', v_old ->> 'id')::uuid;
  else
    v_school := coalesce(v_new ->> 'school_id', v_old ->> 'school_id')::uuid;
  end if;
  v_entity := coalesce(v_new ->> 'id', v_old ->> 'id')::uuid;

  v_meta := jsonb_build_object('before', v_old, 'after', v_new);
  if tg_table_name = 'schools' then
    v_meta := v_meta || jsonb_build_object(
      'school_name_ar', coalesce(v_new ->> 'name_ar', v_old ->> 'name_ar'),
      'school_name_en', coalesce(v_new ->> 'name_en', v_old ->> 'name_en')
    );
  end if;

  insert into public.audit_logs (school_id, actor_id, actor_label, action, entity_type, entity_id, metadata)
  values (
    (select s.id from public.schools s where s.id = v_school),
    auth.uid(),
    case when auth.uid() is null then 'system' end,
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    v_entity,
    v_meta
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger audit_schools
  after insert or update or delete on public.schools
  for each row execute function public.audit_row_change();

create trigger audit_departments
  after insert or update or delete on public.departments
  for each row execute function public.audit_row_change();

create trigger audit_locations
  after insert or update or delete on public.locations
  for each row execute function public.audit_row_change();

create trigger audit_maintenance_requests
  after insert or update or delete on public.maintenance_requests
  for each row execute function public.audit_row_change();

create trigger audit_maintenance_updates
  after insert or update or delete on public.maintenance_updates
  for each row execute function public.audit_row_change();

create trigger audit_circular_targets
  after insert or update or delete on public.circular_targets
  for each row execute function public.audit_row_change();

create trigger audit_file_metadata
  after insert or update or delete on public.file_metadata
  for each row execute function public.audit_row_change();
