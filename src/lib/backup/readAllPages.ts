type PageResult<T> = {
  data: T[] | null;
  error: { message: string; code?: string } | null;
};

/**
 * Reads every page of a query, or throws.
 *
 * PostgREST caps a response at the project's `max_rows` (1000 locally, a
 * comparable cap when hosted), so a single `select("*")` silently truncates a
 * larger table. This walks the result in fixed pages until one comes back
 * short, and turns any page's error into a thrown failure — the caller must
 * never receive a short array inside a successful payload.
 */
export async function readAllPages<T>(
  buildPage: (from: number) => PromiseLike<PageResult<T>>,
  pageSize: number,
  context: string,
): Promise<T[]> {
  const rows: T[] = [];

  for (let from = 0; ; from += pageSize) {
    const { data, error } = await buildPage(from);
    if (error) {
      throw new Error(`${context}: ${error.message}`);
    }

    const batch = data ?? [];
    rows.push(...batch);
    if (batch.length < pageSize) return rows;
  }
}
