import { restoreKeyColumns } from "./restoreKeyColumns";

/** Stable key for a row, matching the columns in `restoreKeyColumns`. */
export function restoreRowKey(table: string, row: Record<string, unknown>): string {
  return restoreKeyColumns(table)
    .map((column) => String(row[column]))
    .join("|");
}
