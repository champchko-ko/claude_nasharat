type ErrorPattern = {
  patterns: readonly string[];
  key: string;
};

const ERROR_PATTERNS: readonly ErrorPattern[] = [
  { patterns: ["unauthorized", "forbidden"], key: "unauthorizedError" },
  { patterns: ["20mb", "too large", "exceeds"], key: "fileTooLarge" },
  { patterns: ["invalid", "format", "mime"], key: "invalidFileFormat" },
  { patterns: ["mismatch", "signature", "not match"], key: "fileMismatch" },
  { patterns: ["title"], key: "titleRequired" },
  { patterns: ["file"], key: "fileRequired" },
];

export function resolveDocumentErrorMessage(
  rawError: string | null | undefined,
  t: (key: string) => string,
): string {
  if (!rawError) {
    return t("saveError");
  }

  const normalized = rawError.toLowerCase();
  const matched = ERROR_PATTERNS.find((item) =>
    item.patterns.some((pattern) => normalized.includes(pattern)),
  );

  return matched ? t(matched.key) : rawError;
}
