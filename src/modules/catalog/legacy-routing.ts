export function canonicalGamePath(slug: string) {
  return `/hra/${encodeURIComponent(slug)}`;
}

export function legacyCheapSharkRedirect(slug: string | null) {
  return slug ? canonicalGamePath(slug) : null;
}
