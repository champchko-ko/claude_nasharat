import type { SupabaseClient } from "@supabase/supabase-js";
import { readAllPages } from "./readAllPages";
import { resolveTableScope } from "./resolveTableScope";
import { restoreKeyColumns } from "./restoreKeyColumns";
import { restoreRowKey } from "./restoreRowKey";

const PAGE_SIZE = 1000;

/**
 * Keys of the rows that already exist in the restore's scope.
 *
 * Returns a set because the diff only asks "is this payload row new or an
 * overwrite?", and the count of existing keys is what "untouched" means.
 */
export async function readExistingRestoreKeys(
  admin: SupabaseClient,
  table: string,
  schoolId: string | null,
  roleIds: string[] | null,
): Promise<Set<string>> {
  const columns = restoreKeyColumns(table);
  const scope = resolveTableScope(table, schoolId, roleIds);

  let query = admin.from(table).select(columns.join(", "));
  if (scope) query = query.in(scope.column, scope.values);
  const typed = query.returns<Record<string, unknown>[]>();

  const rows = await readAllPages<Record<string, unknown>>(
    (from) => {
      let page = typed;
      for (const column of columns) page = page.order(column, { ascending: true });
      return page.range(from, from + PAGE_SIZE - 1);
    },
    PAGE_SIZE,
    `Restore preview failed for ${table}`,
  );

  return new Set(rows.map((row) => restoreRowKey(table, row)));
}
