import { randomUUID } from "node:crypto";
import { computeBackupChecksum } from "../../src/lib/backup/computeBackupChecksum";
import { BACKUP_EXCLUSIONS } from "../../src/lib/backup/backupExclusions";
import { BACKUP_FORMAT_VERSION } from "../../src/lib/backup/backupFormatVersion";
import type { DatabaseBackupPayload } from "../../src/lib/backup/types";

/**
 * Builds a valid school-scoped backup larger than 5 MiB but under the 10 MB
 * console limit, so the E2E journey proves the raised Server Action body limit
 * (finding H-8) rather than the old 1 MB default.
 */
export function buildLargeBackupPayload(input: {
  schoolId: string;
  ownerId: string;
  eventCount?: number;
  descriptionBytes?: number;
}): DatabaseBackupPayload {
  const eventCount = input.eventCount ?? 110;
  const descriptionBytes = input.descriptionBytes ?? 50_000;
  const startsAt = new Date().toISOString();
  const endsAt = new Date(Date.now() + 3_600_000).toISOString();

  const calendarEvents = Array.from({ length: eventCount }, (_, index) => ({
    id: randomUUID(),
    school_id: input.schoolId,
    title_ar: `حدث كبير ${index}`,
    title_en: `Large event ${index}`,
    description: "x".repeat(descriptionBytes),
    starts_at: startsAt,
    ends_at: endsAt,
    created_by: input.ownerId,
  }));

  const tables: DatabaseBackupPayload["tables"] = { calendar_events: calendarEvents };

  return {
    metadata: {
      version: BACKUP_FORMAT_VERSION,
      schemaVersion: BACKUP_FORMAT_VERSION,
      exportedAt: new Date().toISOString(),
      exportedBy: input.ownerId,
      scope: "school",
      schoolId: input.schoolId,
      schoolName: "E2E School",
      tableCounts: { calendar_events: calendarEvents.length },
      totalRows: calendarEvents.length,
      checksum: computeBackupChecksum(tables),
      exclusions: BACKUP_EXCLUSIONS.map((exclusion) => ({ ...exclusion })),
    },
    tables,
  };
}
