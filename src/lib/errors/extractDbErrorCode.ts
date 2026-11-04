type DbErrorLike = {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
};

export function extractDbErrorCode(error: unknown): string | undefined {
  if (typeof error === "object" && error !== null && "code" in error) {
    const candidate = (error as DbErrorLike).code;
    return typeof candidate === "string" ? candidate : undefined;
  }
  return undefined;
}
