export function slugBase(title: string): string {
  return (
    title
      .normalize("NFKD")
      .replace(/[\u0300-\u036f]/g, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .slice(0, 72) || "hra"
  );
}

export function stableGameSlug(title: string, collisionKey?: string): string {
  const base = slugBase(title);
  if (!collisionKey) return base;
  let hash = 5381;
  for (const character of collisionKey) hash = (hash * 33) ^ character.charCodeAt(0);
  const suffix = (hash >>> 0).toString(36).padStart(6, "0").slice(0, 8);
  return `${base}-${suffix}`;
}
