import { createHash } from "node:crypto";

/**
 * SHA-256 over the table payload, independent of key order.
 *
 * The manifest carries it so a restore can prove the file it received is the
 * file that was exported, and so two exports of unchanged data compare equal.
 */
export function computeBackupChecksum(tables: unknown): string {
  const canonicalize = (value: unknown): unknown => {
    if (Array.isArray(value)) return value.map(canonicalize);
    if (value !== null && typeof value === "object") {
      return Object.fromEntries(
        Object.keys(value as Record<string, unknown>)
          .sort()
          .map((key) => [key, canonicalize((value as Record<string, unknown>)[key])]),
      );
    }
    return value;
  };

  return createHash("sha256")
    .update(JSON.stringify(canonicalize(tables)))
    .digest("hex");
}
