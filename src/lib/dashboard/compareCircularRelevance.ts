interface RelevanceInput {
  overdue: number;
  publishAt: string | null;
  refNumber: string;
}

/**
 * Order for the dashboard selector: circulars with overdue targets first, then
 * the most recently published (Dashboard_Fix_All_Issues_Prompt.md Phase 4.3).
 */
export function compareCircularRelevance(a: RelevanceInput, b: RelevanceInput): number {
  if (a.overdue !== b.overdue) {
    return b.overdue - a.overdue;
  }
  const published = (b.publishAt ?? "").localeCompare(a.publishAt ?? "");
  if (published !== 0) {
    return published;
  }
  return a.refNumber.localeCompare(b.refNumber);
}
