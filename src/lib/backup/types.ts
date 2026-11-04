export type BackupExclusion = { item: string; reason: string };

export type BackupMetadata = {
  version: number;
  schemaVersion?: number;
  exportedAt: string;
  exportedBy: string;
  scope: "platform" | "school";
  schoolId: string | null;
  schoolName?: string | null;
  tableCounts?: Record<string, number>;
  totalRows?: number;
  checksum?: string;
  exclusions?: BackupExclusion[];
};

export type DatabaseBackupPayload = {
  metadata: BackupMetadata;
  tables: {
    schools?: Record<string, unknown>[];
    school_settings?: Record<string, unknown>[];
    departments?: Record<string, unknown>[];
    locations?: Record<string, unknown>[];
    roles?: Record<string, unknown>[];
    role_permissions?: Record<string, unknown>[];
    profiles?: Record<string, unknown>[];
    user_role_assignments?: Record<string, unknown>[];
    school_sequences?: Record<string, unknown>[];
    circulars?: Record<string, unknown>[];
    circular_targets?: Record<string, unknown>[];
    circular_responses?: Record<string, unknown>[];
    maintenance_requests?: Record<string, unknown>[];
    maintenance_assignments?: Record<string, unknown>[];
    maintenance_updates?: Record<string, unknown>[];
    calendar_events?: Record<string, unknown>[];
    school_achievements?: Record<string, unknown>[];
  };
};

export type RestoreSummary = {
  success: boolean;
  totalRecords: number;
  tableCounts: Record<string, number>;
  message?: string;
  /** Axe/restore provenance: the pre-restore snapshot and reconciled accounts. */
  snapshotId?: string;
  authUsersCreated?: number;
};

/** Per-table preview of what a restore would change. */
export type RestoreDiff = {
  added: number;
  overwritten: number;
  untouched: number;
  perTable: Record<string, { added: number; overwritten: number; untouched: number }>;
};
