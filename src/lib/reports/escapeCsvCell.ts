const FORMULA_TRIGGERS = ["=", "+", "-", "@", "\t", "\r"];

export function escapeCsvCell(value: unknown): string {
  if (value === null || value === undefined) {
    return "";
  }

  let str = String(value);

  // Prevent CSV / Excel formula injection
  if (FORMULA_TRIGGERS.some((trigger) => str.startsWith(trigger))) {
    str = `'${str}`;
  }

  // Quote if contains comma, quote, or newline
  if (str.includes(",") || str.includes('"') || str.includes("\n") || str.includes("\r")) {
    return `"${str.replace(/"/g, '""')}"`;
  }

  return str;
}
