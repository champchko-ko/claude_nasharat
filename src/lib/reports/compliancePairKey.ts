/** Composite key so one map can answer "what did this department answer here?". */
export function compliancePairKey(circularId: string, departmentId: string): string {
  return `${circularId}::${departmentId}`;
}
