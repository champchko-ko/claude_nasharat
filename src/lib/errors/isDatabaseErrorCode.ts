const POSTGRES_CODE = /^[0-9A-Z]{5}$/;
const POSTGREST_CODE = /^PGRST\d{3}$/;

/** True for Postgres SQLSTATE / PostgREST error codes, not arbitrary app codes. */
export function isDatabaseErrorCode(code: unknown): code is string {
  return typeof code === "string" && (POSTGRES_CODE.test(code) || POSTGREST_CODE.test(code));
}
