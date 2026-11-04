-- 0017: The audit trigger must not write rows during FK cascade deletions:
-- a school being removed invalidates any audit row that references it.
-- Explicit (depth-1) changes keep full auditing.
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
begin
  -- Cascaded deletes (school/user removal) fire this trigger at depth > 1;
  -- skip auditing there so we never reference rows that are mid-deletion.
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

  v_school := coalesce(v_new ->> 'school_id', v_old ->> 'school_id')::uuid;
  v_entity := coalesce(v_new ->> 'id', v_old ->> 'id')::uuid;

  insert into public.audit_logs (school_id, actor_id, actor_label, action, entity_type, entity_id, metadata)
  values (
    v_school,
    auth.uid(),
    case when auth.uid() is null then 'system' end,
    tg_table_name || '.' || lower(tg_op),
    tg_table_name,
    v_entity,
    jsonb_build_object('before', v_old, 'after', v_new)
  );

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;
