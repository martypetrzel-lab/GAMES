export function canonicalGamePath(slug: string) {
  return `/hra/${encodeURIComponent(slug)}`;
}

export function legacyCheapSharkRedirect(slug: string | null) {
  return slug ? canonicalGamePath(slug) : null;
}

export function legacyRedirectDecision(slug: string | null, externalId: string) {
  return slug
    ? { path: canonicalGamePath(slug), status: 308 as const }
    : { path: `/hledat?q=${encodeURIComponent(externalId)}`, status: 307 as const };
}
