export function computeAverageResolutionTime(
  tickets: Array<{ created_at: string; resolved_at: string | null }>,
): number | null {
  const resolved = tickets.filter((t) => Boolean(t.resolved_at));
  if (!resolved.length) return null;

  const totalHours = resolved.reduce((acc, t) => {
    const start = new Date(t.created_at).getTime();
    const end = new Date(t.resolved_at as string).getTime();
    const diffHours = (end - start) / (1000 * 60 * 60);
    return acc + Math.max(0, diffHours);
  }, 0);

  return Math.round((totalHours / resolved.length) * 10) / 10;
}
