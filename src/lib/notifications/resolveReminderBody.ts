type Translator = (key: string, values?: Record<string, string | number>) => string;

export function resolveReminderBody(body: string | null, t: Translator): string {
  if (body?.startsWith("{")) {
    try {
      const parsed = JSON.parse(body) as { ref?: string; title?: string };
      if (parsed.ref && parsed.title) {
        return t("templates.circular_reminder.bodyWithRef", {
          ref: parsed.ref,
          title: parsed.title,
        });
      }
    } catch {
      // Return raw string if not valid JSON
    }
  }

  if (
    !body ||
    body === "circular_reminder" ||
    body === "يرجى مراجعة وتأكيد استلام التعاميم الإدارية المعلقة لقسمكم"
  ) {
    return t("templates.circular_reminder.bodyDefault");
  }

  return body;
}
