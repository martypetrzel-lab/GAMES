import type { SearchResult } from "@/modules/prices/domain/types";

export type SearchSort = "price" | "discount" | "name" | "updated";
export type SearchFilters = Readonly<{
  sort: SearchSort;
  store?: string;
  minDiscount?: number;
  minPrice?: number;
  maxPrice?: number;
  activation?:
    "steam" | "steam-key" | "direct" | "epic" | "gog" | "authorized" | "verified" | "unknown";
}>;

export function filterAndSortGames(games: SearchResult[], filters: SearchFilters): SearchResult[] {
  const filtered = games
    .map((game) => ({
      ...game,
      offers: game.offers.filter((offer) => {
        if (filters.store && offer.externalStoreId !== filters.store) return false;
        if (filters.minDiscount !== undefined && offer.savingsPercent < filters.minDiscount)
          return false;
        if (filters.minPrice !== undefined && offer.price.minor < filters.minPrice) return false;
        if (filters.maxPrice !== undefined && offer.price.minor > filters.maxPrice) return false;
        const id = offer.externalStoreId;
        const directSteam = id === "1",
          directEpic = id === "25",
          directGog = id === "7";
        const authorized = ["3", "11", "15", "27"].includes(id);
        if (filters.activation === "steam" && !directSteam) return false;
        if (filters.activation === "steam-key") return false;
        if (filters.activation === "direct" && !(directSteam || directEpic || directGog))
          return false;
        if (filters.activation === "epic" && !directEpic) return false;
        if (filters.activation === "gog" && !directGog) return false;
        if (filters.activation === "authorized" && !authorized) return false;
        if (
          filters.activation === "verified" &&
          !(directSteam || directEpic || directGog || authorized)
        )
          return false;
        if (filters.activation === "unknown" && (directSteam || directEpic || directGog))
          return false;
        return true;
      }),
    }))
    .filter((game) => game.offers.length > 0);

  return filtered.sort((a, b) => {
    const aBest = a.offers[0];
    const bBest = b.offers[0];
    if (filters.sort === "name") return a.title.localeCompare(b.title, "cs");
    if (filters.sort === "discount")
      return (
        Math.max(...b.offers.map((o) => o.savingsPercent)) -
        Math.max(...a.offers.map((o) => o.savingsPercent))
      );
    if (filters.sort === "updated")
      return (
        Math.max(...b.offers.map((offer) => offer.observedAt.getTime())) -
        Math.max(...a.offers.map((offer) => offer.observedAt.getTime()))
      );
    return aBest.price.minor - bBest.price.minor;
  });
}
