# Phase 2a: authorization functions, guards, triggers, grants

Adds migrations 0010 to 0013 on top of Phase 1. No tables change.

| File | What it adds |
|---|---|
| 0010_authorization_functions.sql | has_permission, effective_permission_keys, is_platform_owner, is_school_member, can_access_department, can_read_roles, is_circular_target, is_public_school_active, bootstrap_platform_owner, numbering, set_audit_actor |
| 0011_guard_functions.sql | role/assignment/profile safety, notification/circular/maintenance guards, audit trigger function |
| 0012_triggers.sql | updated_at triggers, guards, audit triggers |
| 0013_function_grants.sql | function execute rights (private by default) |

Not in 2a (next): row-level security policies, storage, public view (2b);
circular response, user removal and backup/restore functions, demo seed, RLS test harness (2c).

## Apply (in your claude_nasharat folder, PowerShell)

```powershell
git checkout single-school-baseline
Expand-Archive .\phase2a-functions-triggers.zip -DestinationPath .\_phase2a -Force
Copy-Item .\_phase2a\phase2a\supabase\migrations\*.sql .\supabase\migrations\
$env:SUPABASE_DB_PASSWORD = 'your-database-password'
supabase db push
```

## Test

Paste `_phase2a\phase2a\checks\phase2a_tests.sql` into the Supabase SQL Editor and run it.
Expected result: `phase 2a behaviour tests passed`. It rolls back, leaving no data.
If it fails, send the full error text (it starts with `FAILED`).

## Then clean up and commit

```powershell
Remove-Item .\_phase2a -Recurse -Force
git add -A
git commit -m "Phase 2a: authorization functions, guards, triggers"
git push
```

Notes: the SQL has not been executed by me; it was only checked statically.
