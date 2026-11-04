import { hasPermission } from "@/lib/rbac/hasPermission";

export async function assertCanAddNote(
  schoolId: string,
  userId: string,
  reporterId: string,
  assignedOperatorId: string | null,
): Promise<boolean> {
  if (userId === reporterId || userId === assignedOperatorId) {
    return true;
  }
  return hasPermission("maintenance.assign", schoolId);
}
