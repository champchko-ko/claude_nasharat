export function generateFallbackReferenceNumber(kind: "circular" | "maintenance"): string {
  const year = new Date().getFullYear();
  const prefix = kind === "circular" ? "CIR" : "MR";
  const timestamp = Date.now().toString().slice(-4);
  return `${prefix}-${year}-${timestamp}`;
}
