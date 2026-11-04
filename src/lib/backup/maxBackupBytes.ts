/**
 * Largest restore payload the console accepts.
 *
 * `next.config.mjs` raises the Server Action body limit above this value so a
 * file of this size fits; the client refuses anything larger with a clear
 * message instead of failing at the transport layer.
 */
export const MAX_BACKUP_BYTES = 10 * 1024 * 1024;
