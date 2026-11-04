export function formatSchoolDate(input?: string | Date | null, dateFormat = "yyyy-MM-dd"): string {
  if (!input) return "—";
  const date = input instanceof Date ? input : new Date(input);
  if (Number.isNaN(date.getTime())) return "—";

  const yyyy = String(date.getFullYear());
  const MM = String(date.getMonth() + 1).padStart(2, "0");
  const dd = String(date.getDate()).padStart(2, "0");

  switch (dateFormat) {
    case "dd/MM/yyyy":
      return `${dd}/${MM}/${yyyy}`;
    case "MM/dd/yyyy":
      return `${MM}/${dd}/${yyyy}`;
    case "yyyy-MM-dd":
    default:
      return `${yyyy}-${MM}-${dd}`;
  }
}
