import { getFirstActiveSchoolId } from "./getFirstActiveSchoolId";

export async function resolveSchoolForCaller(
  profile: { id: string } | null,
): Promise<string | null> {
  if (!profile) {
    return null;
  }
  return getFirstActiveSchoolId();
}
