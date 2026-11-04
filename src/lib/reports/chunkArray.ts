/**
 * Splits an array into smaller chunks of a specified maximum size.
 * Useful for chunking large batches of IDs in PostgREST `.in()` filters
 * to prevent URI length limit overflow (HTTP 414).
 */
export function chunkArray<T>(items: readonly T[], chunkSize = 100): T[][] {
  if (chunkSize <= 0) {
    throw new Error("chunkSize must be greater than 0");
  }
  if (items.length === 0) {
    return [];
  }

  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += chunkSize) {
    chunks.push(items.slice(i, i + chunkSize));
  }
  return chunks;
}
