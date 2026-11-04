export function can(permissions: readonly string[], key: string): boolean {
  return permissions.includes(key);
}
