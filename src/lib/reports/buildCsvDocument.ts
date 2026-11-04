import { formatCsvRow } from "./formatCsvRow";

export function buildCsvDocument(headers: string[], rows: unknown[][]): string {
  const headerLine = formatCsvRow(headers);
  const dataLines = rows.map((row) => formatCsvRow(row));
  const content = [headerLine, ...dataLines].join("\r\n");
  return `\uFEFF${content}`;
}
