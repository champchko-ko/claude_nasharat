import { escapeCsvCell } from "./escapeCsvCell";

export function formatCsvRow(cells: unknown[]): string {
  return cells.map((cell) => escapeCsvCell(cell)).join(",");
}
