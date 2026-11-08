/**
 * The export/restore contract: which tables travel in a backup, in dependency
 * order, and which columns identify an existing row on restore.
 *
 * `orderColumns` gives PostgREST a deterministic sort so `.range()` pagination
 * cannot repeat or skip rows. The conflict columns double as the order for the
 * three link tables that have no `id`.
 */
export type BackupTableSpec = {
  name: string;
  conflictColumns: string[];
  orderColumns: string[];
};

export const BACKUP_TABLES: readonly BackupTableSpec[] = [
  { name: "schools", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "school_settings", conflictColumns: ["singleton"], orderColumns: ["singleton"] },
  { name: "departments", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "locations", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "roles", conflictColumns: ["id"], orderColumns: ["id"] },
  {
    name: "role_permissions",
    conflictColumns: ["role_id", "permission_key"],
    orderColumns: ["role_id", "permission_key"],
  },
  { name: "profiles", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "user_role_assignments", conflictColumns: ["id"], orderColumns: ["id"] },
  {
    name: "school_sequences",
    conflictColumns: ["kind", "year"],
    orderColumns: ["kind", "year"],
  },
  { name: "circulars", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "circular_targets", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "circular_responses", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "maintenance_requests", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "maintenance_assignments", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "maintenance_updates", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "calendar_events", conflictColumns: ["id"], orderColumns: ["id"] },
  { name: "school_achievements", conflictColumns: ["id"], orderColumns: ["id"] },
];
