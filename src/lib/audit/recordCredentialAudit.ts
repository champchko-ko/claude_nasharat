import { createSupabaseAdminClient } from "@/lib/supabase/createSupabaseAdminClient";
import { logError } from "@/lib/logger";

export type CredentialAuditInput = {
  schoolId?: string | null;
  actorId: string;
  actorLabel?: string | null;
  action: "credentials.password_change" | "credentials.password_reset" | "credentials.email_change";
  entityId: string;
  metadata?: Record<string, unknown>;
};

export async function recordCredentialAudit(input: CredentialAuditInput): Promise<void> {
  const admin = createSupabaseAdminClient({
    actorId: input.actorId,
    actorLabel: input.actorLabel,
  });

  const { error } = await admin.from("audit_logs").insert({
    school_id: input.schoolId ?? null,
    actor_id: input.actorId,
    actor_label: input.actorLabel ?? null,
    action: input.action,
    entity_type: "user",
    entity_id: input.entityId,
    metadata: input.metadata ?? {},
  });

  if (error) {
    logError(error, {
      scope: "recordCredentialAudit",
      action: input.action,
      actorId: input.actorId,
      entityId: input.entityId,
    });
  }
}
