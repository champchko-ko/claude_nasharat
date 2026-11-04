export function resolveCategoryLabel(
  category: string,
  translate: (key: never) => string,
  hasKey: (key: string) => boolean,
): string {
  return hasKey(category) ? translate(category as never) : category;
}
