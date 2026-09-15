import { describe, expect, it } from "vitest";
import { filterAndSortGames } from "./search-controls";
import type { SearchResult } from "./types";

const offer = (store: string, price: number, discount: number) => ({
  provider: "cheapshark",
  externalOfferId: `${store}-${price}`,
  externalGameId: "1",
  externalStoreId: store,
  title: "Hra",
  steamAppId: null,
  imageUrl: null,
  price: { minor: price, currency: "USD" as const },
  regularPrice: { minor: 2000, currency: "USD" as const },
  savingsPercent: discount,
  observedAt: new Date("2026-01-01"),
  targetUrl: "https://www.cheapshark.com/redirect?dealID=x",
  storeName: store,
  persistedId: null,
});

describe("search controls", () => {
  const games: SearchResult[] = [
    {
      externalGameId: "1",
      title: "Beta",
      steamAppId: null,
      imageUrl: null,
      slug: "beta",
      productType: "GAME",
      offers: [offer("2", 1000, 50)],
    },
    {
      externalGameId: "2",
      title: "Alfa",
      steamAppId: "1",
      imageUrl: null,
      slug: "alfa",
      productType: "GAME",
      offers: [offer("1", 500, 20)],
    },
  ];
  it("filtruje obchod a přímý Steam bez odhadování klíčů", () => {
    expect(
      filterAndSortGames(games, { sort: "price", activation: "steam" }).map((g) => g.title),
    ).toEqual(["Alfa"]);
    expect(filterAndSortGames(games, { sort: "price", store: "2" }).map((g) => g.title)).toEqual([
      "Beta",
    ]);
  });
  it("řadí podle názvu a slevy", () => {
    expect(filterAndSortGames(games, { sort: "name" }).map((g) => g.title)).toEqual([
      "Alfa",
      "Beta",
    ]);
    expect(filterAndSortGames(games, { sort: "discount" })[0].title).toBe("Beta");
  });
});
