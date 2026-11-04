export function extractTicketDepartment(
  dept?: { id: string; name_ar: string; name_en: string } | null,
  reporterDeptId?: string | null,
): { id: string | null; name: string | null } {
  if (dept) {
    return { id: dept.id, name: dept.name_ar || dept.name_en || null };
  }
  return { id: reporterDeptId ?? null, name: null };
}
