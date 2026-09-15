export const PUBLIC_CACHE_TAGS = {
  offers: "public-offers",
  catalog: "public-catalog",
  home: "home-highlights",
  freeGames: "free-games",
} as const;

export async function preferStoredData<T>(stored: T[], loadWhenMissing: () => Promise<T[]>) {
  return stored.length ? stored : loadWhenMissing();
}
