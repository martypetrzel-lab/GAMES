import { ZodError, type ZodType } from "zod";

import { parseUsdToCents } from "@/lib/money/money";
import { approvedProviderImageUrl, createCheapSharkRedirectUrl } from "@/lib/urls/safe-url";
import type {
  ProviderGameDetail,
  ProviderOffer,
  ProviderStore,
} from "@/modules/prices/domain/types";
import type { PriceProvider } from "@/modules/prices/providers/price-provider";
import { ProviderError } from "@/modules/prices/providers/provider-error";
import {
  cheapSharkDealsSchema,
  cheapSharkGameSchema,
  cheapSharkStoresSchema,
} from "@/modules/prices/providers/cheapshark/schemas";

type FetchLike = typeof fetch;

type CheapSharkProviderOptions = {
  userAgent: string;
  contactEmail?: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
  now?: () => Date;
};

type CacheEntry = { expiresAt: number; value: unknown };

export class CheapSharkProvider implements PriceProvider {
  readonly id = "cheapshark";
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;
  private readonly now: () => Date;
  private readonly userAgent: string;
  private readonly cache = new Map<string, CacheEntry>();

  constructor(options: CheapSharkProviderOptions) {
    this.userAgent = options.contactEmail
      ? `${options.userAgent} contact:${options.contactEmail}`
      : options.userAgent;
    this.baseUrl = options.baseUrl ?? "https://www.cheapshark.com/api/1.0";
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 6_000;
    this.now = options.now ?? (() => new Date());
  }

  async searchOffers(query: string): Promise<ProviderOffer[]> {
    const url = new URL(`${this.baseUrl}/deals`);
    url.searchParams.set("title", query);
    url.searchParams.set("pageSize", "24");
    url.searchParams.set("sortBy", "Price");

    const deals = await this.getJson(url, cheapSharkDealsSchema, 5 * 60_000);
    return deals.map((deal) =>
      this.mapOffer({
        dealId: deal.dealID,
        gameId: deal.gameID,
        storeId: deal.storeID,
        title: deal.title,
        steamAppId: deal.steamAppID,
        imageUrl: deal.thumb,
        price: deal.salePrice,
        regularPrice: deal.normalPrice,
        savings: deal.savings,
        observedAt: new Date(deal.lastChange * 1_000),
      }),
    );
  }

  async getGame(externalGameId: string): Promise<ProviderGameDetail | null> {
    const url = new URL(`${this.baseUrl}/games`);
    url.searchParams.set("id", externalGameId);

    try {
      const game = await this.getJson(url, cheapSharkGameSchema, 5 * 60_000);
      return {
        provider: this.id,
        externalGameId,
        title: game.info.title,
        steamAppId: game.info.steamAppID,
        imageUrl: approvedProviderImageUrl(game.info.thumb),
        offers: game.deals.map((deal) =>
          this.mapOffer({
            dealId: deal.dealID,
            gameId: externalGameId,
            storeId: deal.storeID,
            title: game.info.title,
            steamAppId: game.info.steamAppID,
            imageUrl: approvedProviderImageUrl(game.info.thumb),
            price: deal.price,
            regularPrice: deal.retailPrice,
            savings: deal.savings,
            observedAt: this.now(),
          }),
        ),
        externalHistoricalLow: game.cheapestPriceEver
          ? { minor: parseUsdToCents(game.cheapestPriceEver.price), currency: "USD" }
          : null,
        externalHistoricalLowAt: game.cheapestPriceEver
          ? new Date(game.cheapestPriceEver.date * 1_000)
          : null,
      };
    } catch (error) {
      if (error instanceof ProviderError && error.code === "invalid-response") return null;
      throw error;
    }
  }

  async getStores(): Promise<ProviderStore[]> {
    const stores = await this.getJson(
      new URL(`${this.baseUrl}/stores`),
      cheapSharkStoresSchema,
      24 * 60 * 60_000,
    );

    return stores.map((store) => ({
      externalId: store.storeID,
      name: store.storeName,
      active: store.isActive === 1,
      imageUrl: new URL(store.images.logo, "https://www.cheapshark.com").toString(),
    }));
  }

  private mapOffer(input: {
    dealId: string;
    gameId: string;
    storeId: string;
    title: string;
    steamAppId: string | null;
    imageUrl: string | null;
    price: string;
    regularPrice: string;
    savings: string;
    observedAt: Date;
  }): ProviderOffer {
    let rawDealId: string;
    try {
      rawDealId = decodeURIComponent(input.dealId);
    } catch {
      throw new ProviderError(
        "CheapShark vrátil neplatné ID nabídky.",
        this.id,
        "invalid-response",
      );
    }

    return {
      provider: this.id,
      externalOfferId: rawDealId,
      externalGameId: input.gameId,
      externalStoreId: input.storeId,
      title: input.title,
      steamAppId: input.steamAppId,
      imageUrl: approvedProviderImageUrl(input.imageUrl),
      price: { minor: parseUsdToCents(input.price), currency: "USD" },
      regularPrice: { minor: parseUsdToCents(input.regularPrice), currency: "USD" },
      savingsPercent: Math.max(0, Math.min(100, Math.round(Number(input.savings)))),
      observedAt: input.observedAt,
      targetUrl: createCheapSharkRedirectUrl(rawDealId),
    };
  }

  private async getJson<T>(url: URL, schema: ZodType<T>, ttlMs: number): Promise<T> {
    const key = url.toString();
    const cached = this.cache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.value as T;

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        headers: { Accept: "application/json", "User-Agent": this.userAgent },
        signal: AbortSignal.timeout(this.timeoutMs),
        cache: "no-store",
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      throw new ProviderError(
        timedOut ? "CheapShark neodpověděl včas." : "CheapShark je dočasně nedostupný.",
        this.id,
        timedOut ? "timeout" : "unavailable",
        { cause: error },
      );
    }

    if (response.status === 429) {
      throw new ProviderError(
        "CheapShark dočasně omezil počet požadavků.",
        this.id,
        "rate-limited",
      );
    }
    if (!response.ok) {
      throw new ProviderError(
        `CheapShark odpověděl stavem ${response.status}.`,
        this.id,
        "unavailable",
      );
    }

    try {
      const value = schema.parse(await response.json());
      this.cache.set(key, { expiresAt: Date.now() + ttlMs, value });
      return value;
    } catch (error) {
      throw new ProviderError("CheapShark vrátil neočekávaná data.", this.id, "invalid-response", {
        cause: error instanceof ZodError ? error : undefined,
      });
    }
  }
}
