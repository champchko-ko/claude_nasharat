import type { SupabaseClient } from "@supabase/supabase-js";
import { BACKUP_TABLES } from "./backupTables";
import { filterExcludedOwnerRows } from "./filterExcludedOwnerRows";
import { readAllPages } from "./readAllPages";
import { resolveScopedRoleIds } from "./resolveScopedRoleIds";
import { resolveTableScope } from "./resolveTableScope";

// PostgREST caps a response at the project's `max_rows` (1000 locally, a
// comparable cap when hosted). A single `select("*")` therefore truncates any
// larger table without an error, which is exactly the C-2 failure.
const PAGE_SIZE = 1000;

/**
 * Reads one table completely, or throws.
 *
 * The caller gets either every row in scope or an error — never a silently
 * short array inside a `success: true` payload. After paging, the number of
 * rows read is reconciled against PostgREST's exact count for the same filter.
 */
export async function fetchTableData(
  admin: SupabaseClient,
  tableName: string,
  schoolId?: string | null,
  ownerUserIds?: Set<string>,
): Promise<Record<string, unknown>[]> {
  const spec = BACKUP_TABLES.find((table) => table.name === tableName);
  if (!spec) {
    throw new Error(`Backup export: "${tableName}" is not part of the backup contract`);
  }

  const roleIds = await resolveScopedRoleIds(admin, schoolId ?? null);
  const scope = resolveTableScope(tableName, schoolId ?? null, roleIds);

  let countQuery = admin.from(tableName).select("*", { count: "exact", head: true });
  if (scope) countQuery = countQuery.in(scope.column, scope.values);

  const { count, error: countError } = await countQuery;
  if (countError) {
    throw new Error(`Backup export failed for ${tableName}: ${countError.message}`);
  }
  if (count === null) {
    throw new Error(`Backup export failed for ${tableName}: PostgREST returned no row count`);
  }

  let pageQuery = admin.from(tableName).select("*");
  if (scope) pageQuery = pageQuery.in(scope.column, scope.values);

  const rows = await readAllPages<Record<string, unknown>>(
    (from) => {
      let page = pageQuery;
      for (const column of spec.orderColumns) page = page.order(column, { ascending: true });
      return page.range(from, from + PAGE_SIZE - 1);
    },
    PAGE_SIZE,
    `Backup export failed for ${tableName}`,
  );

  if (rows.length !== count) {
    throw new Error(
      `Backup export for ${tableName} read ${rows.length} rows but the table holds ${count}`,
    );
  }

  return filterExcludedOwnerRows(tableName, rows, ownerUserIds);
}
