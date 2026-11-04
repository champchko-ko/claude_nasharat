import type { ProfileRow } from "@/lib/auth/getCurrentProfile";

export interface ActorDetails {
  actorId?: string;
  actorLabel?: string;
}

export function getActorDetails(profile?: ProfileRow | null): ActorDetails {
  if (!profile) {
    return { actorLabel: "system" };
  }

  return {
    actorId: profile.id,
    actorLabel: profile.email || "system",
  };
}
