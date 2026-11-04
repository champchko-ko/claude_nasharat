import type { SupabaseClient } from "@supabase/supabase-js";
import { countRestoreChanges } from "./countRestoreChanges";
import { readExistingRestoreKeys } from "./readExistingRestoreKeys";
import { resolveScopedRoleIds } from "./resolveScopedRoleIds";
import type { DatabaseBackupPayload, RestoreDiff } from "./types";

/**
 * Previews a restore: how many rows would be inserted, how many would
 * overwrite an existing row, and how many existing rows the restore leaves
 * untouched (restore never deletes).
 */
export async function computeRestoreDiff(
  admin: SupabaseClient,
  payload: DatabaseBackupPayload,
): Promise<RestoreDiff> {
  const schoolId = payload.metadata.scope === "school" ? payload.metadata.schoolId : null;
  const roleIds = await resolveScopedRoleIds(admin, schoolId);

  const perTable: RestoreDiff["perTable"] = {};
  let added = 0;
  let overwritten = 0;
  let untouched = 0;

  for (const [table, rows] of Object.entries(payload.tables)) {
    const existing = await readExistingRestoreKeys(admin, table, schoolId, roleIds);
    const changes = countRestoreChanges(table, rows ?? [], existing);
    const tableUntouched = existing.size - changes.overwritten;

    perTable[table] = { ...changes, untouched: tableUntouched };
    added += changes.added;
    overwritten += changes.overwritten;
    untouched += tableUntouched;
  }

  return { added, overwritten, untouched, perTable };
}
