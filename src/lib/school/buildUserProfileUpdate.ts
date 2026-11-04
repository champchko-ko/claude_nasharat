/**
 * Normalises the editable profile fields before a write.
 *
 * Extracted from `persistUserUpdates` so the persistence function stays within
 * the project's complexity budget; the coercions here are the only branches it
 * used to carry.
 */
export function buildUserProfileUpdate(input: {
  fullName: string;
  email?: string | null;
  phone?: string | null;
  jobTitle?: string | null;
  departmentId?: string | null;
  isActive?: boolean;
}) {
  const payload: Record<string, unknown> = {
    full_name: input.fullName.trim(),
    email: input.email ? input.email.trim().toLowerCase() : null,
    phone: input.phone ? input.phone.trim() : null,
    job_title: input.jobTitle ? input.jobTitle.trim() : null,
    department_id: input.departmentId || null,
    updated_at: new Date().toISOString(),
  };

  if (input.isActive !== undefined) {
    payload.is_active = input.isActive;
  }

  return payload;
}
