import { z } from "zod";
import { BACKUP_FORMAT_VERSION } from "./backupFormatVersion";

const table = z.array(z.record(z.string(), z.unknown())).optional();

export const backupSchema = z
  .object({
    metadata: z.object({
      version: z.number().int().min(1).max(BACKUP_FORMAT_VERSION),
      schemaVersion: z.number().int().min(1).optional(),
      exportedAt: z.string().min(1),
      exportedBy: z.string().min(1),
      scope: z.enum(["platform", "school"]),
      schoolId: z.string().nullable(),
      schoolName: z.string().nullable().optional(),
      tableCounts: z.record(z.string(), z.number().int().min(0)).optional(),
      totalRows: z.number().int().min(0).optional(),
      checksum: z
        .string()
        .regex(/^[a-f0-9]{64}$/)
        .optional(),
      exclusions: z.array(z.object({ item: z.string(), reason: z.string() })).optional(),
    }),
    tables: z.object({
      schools: table,
      school_settings: table,
      departments: table,
      locations: table,
      roles: table,
      role_permissions: table,
      profiles: table,
      user_role_assignments: table,
      school_sequences: table,
      circulars: table,
      circular_targets: table,
      circular_responses: table,
      maintenance_requests: table,
      maintenance_assignments: table,
      maintenance_updates: table,
      calendar_events: table,
      school_achievements: table,
    }),
  })
  .superRefine((value, ctx) => {
    if (value.metadata.scope === "school" && !value.metadata.schoolId) {
      ctx.addIssue({
        code: "custom",
        path: ["metadata", "schoolId"],
        message: "A school-scoped backup must name its school",
      });
    }
  });
