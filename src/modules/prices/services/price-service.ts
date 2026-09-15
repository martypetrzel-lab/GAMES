import "server-only";

import { z } from "zod";

import { getPrisma } from "@/lib/db/prisma";
import type { ProviderGameDetail, SearchResult } from "@/modules/prices/domain/types";
import { getCheapSharkProvider } from "@/modules/prices/providers/provider-registry";
import { ProviderError } from "@/modules/prices/providers/provider-error";
import { persistOffers } from "@/modules/prices/services/offer-persistence";
import { logServerError } from "@/lib/observability/server-log";
import { isPublicStore } from "@/modules/stores/trusted-stores";
import { stableGameSlug } from "@/modules/catalog/slug";
import { classifyProduct } from "@/modules/catalog/product-classification";

const searchQuerySchema = z.string().trim().min(2).max(80);
const externalIdSchema = z.string().regex(/^\d{1,12}$/);
const inFlightSearches = new Map<string, Promise<SearchResult[]>>();

async function performSearchGames(rawQuery: string): Promise<SearchResult[]> {
  const query = searchQuerySchema.parse(rawQuery);
  const provider = getCheapSharkProvider();
  const db = getPrisma();
  const run = await db.providerRun.create({
    data: { provider: provider.id, kind: "user-search", query, status: "running" },
  });

  try {
    const [offers, stores] = await Promise.all([
      provider.searchOffers(query),
      provider.getStores(),
    ]);
    const publicOffers = offers.filter((offer) =>
      isPublicStore(offer.provider, offer.externalStoreId),
    );
    const persistedIds = await persistOffers(publicOffers, stores);
    const providerGames = await db.providerGame.findMany({
      where: {
        provider: provider.id,
        externalId: { in: [...new Set(publicOffers.map((offer) => offer.externalGameId))] },
      },
      select: { externalId: true, game: { select: { slug: true } } },
    });
    const slugs = new Map(providerGames.map((item) => [item.externalId, item.game.slug]));
    const storeNames = new Map(stores.map((store) => [store.externalId, store.name]));
    const grouped = new Map<string, SearchResult>();

    for (const offer of publicOffers) {
      const current = grouped.get(offer.externalGameId) ?? {
        externalGameId: offer.externalGameId,
        title: offer.title,
        steamAppId: offer.steamAppId,
        imageUrl: offer.imageUrl,
        slug:
          slugs.get(offer.externalGameId) ??
          stableGameSlug(offer.title, `${offer.provider}:${offer.externalGameId}`),
        productType: classifyProduct(offer.title),
        offers: [],
      };
      current.offers.push({
        ...offer,
        storeName: storeNames.get(offer.externalStoreId) ?? "Neznámý obchod",
        persistedId: persistedIds.get(offer.externalOfferId) ?? null,
      });
      grouped.set(offer.externalGameId, current);
    }

    const results = [...grouped.values()].map((game) => ({
      ...game,
      offers: game.offers.sort((a, b) => a.price.minor - b.price.minor),
    }));
    await db.providerRun.update({
      where: { id: run.id },
      data: { status: "success", itemCount: publicOffers.length, completedAt: new Date() },
    });
    return results;
  } catch (error) {
    const area =
      error instanceof ProviderError
        ? error.provider === "cheapshark"
          ? error.code === "invalid-response"
            ? "external-validation"
            : "cheapshark"
          : "search"
        : typeof (error as { code?: unknown })?.code === "string" &&
            String((error as { code: string }).code).startsWith("P")
          ? "database"
          : "persistence";
    logServerError(area, error, {
      operation: "search-games",
      provider: provider.id,
      code: error instanceof ProviderError ? error.code : undefined,
    });
    await db.providerRun
      .update({
        where: { id: run.id },
        data: {
          status: "failed",
          errorMessage: error instanceof Error ? error.message.slice(0, 500) : "Neznámá chyba",
          completedAt: new Date(),
        },
      })
      .catch((updateError) =>
        logServerError("persistence", updateError, { operation: "provider-run-failure" }),
      );
    throw error;
  }
}

export function searchGames(rawQuery: string): Promise<SearchResult[]> {
  const key = rawQuery.trim().toLocaleLowerCase("cs-CZ");
  const current = inFlightSearches.get(key);
  if (current) return current;
  const request = performSearchGames(rawQuery).finally(() => inFlightSearches.delete(key));
  inFlightSearches.set(key, request);
  return request;
}

export async function getGameDetail(rawExternalId: string): Promise<{
  game: ProviderGameDetail;
  offers: SearchResult["offers"];
} | null> {
  const externalId = externalIdSchema.parse(rawExternalId);
  const provider = getCheapSharkProvider();
  const [game, stores] = await Promise.all([provider.getGame(externalId), provider.getStores()]);
  if (!game) return null;

  const publicOffers = game.offers.filter((offer) =>
    isPublicStore(offer.provider, offer.externalStoreId),
  );
  const persistedIds = await persistOffers(publicOffers, stores);
  const storeNames = new Map(stores.map((store) => [store.externalId, store.name]));
  return {
    game,
    offers: publicOffers
      .map((offer) => ({
        ...offer,
        storeName: storeNames.get(offer.externalStoreId) ?? "Neznámý obchod",
        persistedId: persistedIds.get(offer.externalOfferId) ?? null,
      }))
      .sort((a, b) => a.price.minor - b.price.minor),
  };
}
