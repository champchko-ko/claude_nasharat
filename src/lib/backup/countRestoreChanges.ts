import { restoreRowKey } from "./restoreRowKey";

/**
 * Classifies payload rows against the keys that already exist.
 *
 * A row is "overwritten" when its key is present, "added" otherwise. Rows the
 * payload does not mention are counted by the caller as untouched.
 */
export function countRestoreChanges(
  table: string,
  rows: Record<string, unknown>[],
  existing: Set<string>,
): { added: number; overwritten: number } {
  let added = 0;
  let overwritten = 0;

  for (const row of rows) {
    if (existing.has(restoreRowKey(table, row))) overwritten += 1;
    else added += 1;
  }

  return { added, overwritten };
}
