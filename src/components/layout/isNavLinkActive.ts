export function isNavLinkActive({
  pathname,
  href,
  exact = false,
  excludedPrefixes,
}: {
  pathname: string;
  href: string;
  exact?: boolean;
  excludedPrefixes?: string[];
}): boolean {
  const excluded = excludedPrefixes?.some((prefix) => pathname.startsWith(prefix)) ?? false;
  if (excluded) return false;
  return exact || href === "/dashboard" ? pathname === href : pathname.startsWith(href);
}
