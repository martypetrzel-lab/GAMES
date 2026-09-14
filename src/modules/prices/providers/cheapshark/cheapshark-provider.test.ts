import { describe, expect, it, vi } from "vitest";

import { CheapSharkProvider } from "./cheapshark-provider";
import { ProviderError } from "../provider-error";

const dealFixture = [
  {
    title: "Test Game",
    dealID: "abc%2B123%3D",
    storeID: "1",
    gameID: "42",
    salePrice: "4.79",
    normalPrice: "9.99",
    savings: "52.052052",
    steamAppID: "123",
    lastChange: 1_700_000_000,
    thumb: "https://example.com/game.jpg",
  },
];

describe("CheapSharkProvider", () => {
  it("mapuje a cachuje validní odpověď adaptéru", async () => {
    const fetchImpl = vi.fn(async () => Response.json(dealFixture));
    const provider = new CheapSharkProvider({ userAgent: "GameRadarCZ/Test", fetchImpl });

    const first = await provider.searchOffers("test");
    const second = await provider.searchOffers("test");

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(first).toEqual(second);
    expect(first[0]).toMatchObject({
      externalOfferId: "abc+123=",
      externalGameId: "42",
      price: { minor: 479, currency: "USD" },
      regularPrice: { minor: 999, currency: "USD" },
      savingsPercent: 52,
    });
  });

  it("ohlásí rate limit bez skrytého opakování požadavku", async () => {
    const provider = new CheapSharkProvider({
      userAgent: "GameRadarCZ/Test",
      fetchImpl: vi.fn(async () => new Response(null, { status: 429 })),
    });
    await expect(provider.searchOffers("test")).rejects.toMatchObject<Partial<ProviderError>>({
      code: "rate-limited",
    });
  });

  it("odmítne neočekávaná externí data", async () => {
    const provider = new CheapSharkProvider({
      userAgent: "GameRadarCZ/Test",
      fetchImpl: vi.fn(async () => Response.json([{ title: "neúplné" }])),
    });
    await expect(provider.searchOffers("test")).rejects.toMatchObject<Partial<ProviderError>>({
      code: "invalid-response",
    });
  });
});
