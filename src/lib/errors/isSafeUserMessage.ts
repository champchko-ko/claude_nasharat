const UNSAFE_PATTERNS = [
  /\bselect\b[\s\S]*\bfrom\b/i,
  /\binsert\s+into\b/i,
  /\bupdate\b[\s\S]*\bset\b/i,
  /\bdelete\s+from\b/i,
  /\brelation\s+"/i,
  /\bcolumn\s+"/i,
  /\bconstraint\b/i,
  /\bviolates\b/i,
  /\bduplicate key\b/i,
  /\bpermission denied\b/i,
  /\bjwt\b/i,
  /\bpq:\b/i,
  /\bpostgres/i,
  /\bsupabase\b/i,
  /\bbucket\b/i,
  /\bstorage\b/i,
  /:\/\//,
  /\bat\s+[\w.]+\s+\(/,
  /\bnode_modules\b/i,
  /\bsyntax error\b/i,
];

/**
 * A message is safe to show only when it is short, single-line and does not
 * read like a database/driver/stack-trace message.
 */
export function isSafeUserMessage(message: unknown): message is string {
  if (typeof message !== "string") return false;
  const trimmed = message.trim();
  if (!trimmed || trimmed.length > 200) return false;
  if (trimmed.includes("\n") || trimmed.includes("\r")) return false;
  return !UNSAFE_PATTERNS.some((pattern) => pattern.test(trimmed));
}
