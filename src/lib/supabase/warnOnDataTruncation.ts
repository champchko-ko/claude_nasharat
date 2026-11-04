const DEFAULT_POSTGREST_MAX_ROWS = 1000;

/**
 * Checks if a query's returned row count reached the PostgREST max_rows limit.
 * If so, emits a structured warning to notify operators of silent list truncation.
 *
 * @param count Number of rows returned by the query
 * @param source Identifier of the calling query or table (e.g. 'getSchoolCirculars')
 * @param limit Maximum row ceiling (defaults to 1000)
 * @returns boolean indicating whether truncation threshold was reached
 */
export function warnOnDataTruncation(
  count: number,
  source: string,
  limit: number = DEFAULT_POSTGREST_MAX_ROWS,
): boolean {
  if (count >= limit) {
    console.warn(
      `[DataTruncationWarning] Query "${source}" returned ${count} rows, reaching the PostgREST max_rows ceiling (${limit}). Subsequent records were silently truncated. Consider implementing pagination or tighter filters.`,
    );
    return true;
  }
  return false;
}
