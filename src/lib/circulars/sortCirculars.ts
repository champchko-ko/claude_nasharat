import type { CircularRow, CircularPriority } from "./types";

export type CircularSortField =
  | "publish_at_desc"
  | "publish_at_asc"
  | "due_at_asc"
  | "due_at_desc"
  | "priority_desc"
  | "priority_asc"
  | "status"
  | "ref_number"
  | "title";

const PRIORITY_WEIGHT: Record<CircularPriority, number> = {
  urgent: 4,
  high: 3,
  normal: 2,
  low: 1,
};

const COMPARATORS: Record<CircularSortField, (a: CircularRow, b: CircularRow) => number> = {
  publish_at_desc: (a, b) => {
    const da = new Date(a.publish_at || a.created_at).getTime();
    const db = new Date(b.publish_at || b.created_at).getTime();
    return db - da;
  },
  publish_at_asc: (a, b) => {
    const da = new Date(a.publish_at || a.created_at).getTime();
    const db = new Date(b.publish_at || b.created_at).getTime();
    return da - db;
  },
  due_at_asc: (a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(a.due_at).getTime() - new Date(b.due_at).getTime();
  },
  due_at_desc: (a, b) => {
    if (!a.due_at) return 1;
    if (!b.due_at) return -1;
    return new Date(b.due_at).getTime() - new Date(a.due_at).getTime();
  },
  priority_desc: (a, b) => PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority],
  priority_asc: (a, b) => PRIORITY_WEIGHT[a.priority] - PRIORITY_WEIGHT[b.priority],
  status: (a, b) => a.status.localeCompare(b.status),
  ref_number: (a, b) => a.ref_number.localeCompare(b.ref_number),
  title: (a, b) => a.title.localeCompare(b.title),
};

export function sortCirculars(
  circulars: CircularRow[],
  sortField: CircularSortField,
): CircularRow[] {
  const comparator = COMPARATORS[sortField];
  if (!comparator) return circulars;
  return [...circulars].sort(comparator);
}
