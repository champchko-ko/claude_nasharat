export function parseMaintenanceNoteData(formData: FormData) {
  const get = (k: string) => {
    const v = formData.get(k);
    return typeof v === "string" ? v.trim() : "";
  };

  return {
    requestId: get("request_id"),
    note: get("note"),
  };
}
