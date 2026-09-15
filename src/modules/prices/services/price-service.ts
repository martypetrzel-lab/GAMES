import "server-only";

import { z } from "zod";

import { getPrisma } from "@/lib/db/prisma";
import type { ProviderGameDetail, SearchResult } from "@/modules/prices/domain/types";
import { getCheapSharkProvider } from "@/modules/prices/providers/provider-registry";
import { ProviderError } from "@/modules/prices/providers/provider-error";
import { persistOffers } from "@/modules/prices/services/offer-persistence";
import { logServerError } from "@/lib/observability/server-log";

const searchQuerySchema = z.string().trim().min(2).max(80);
const externalIdSchema = z.string().regex(/^\d{1,12}$/);

export async function searchGames(rawQuery: string): Promise<SearchResult[]> {
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
    const persistedIds = await persistOffers(offers, stores);
    const storeNames = new Map(stores.map((store) => [store.externalId, store.name]));
    const grouped = new Map<string, SearchResult>();

    for (const offer of offers) {
      const current = grouped.get(offer.externalGameId) ?? {
        externalGameId: offer.externalGameId,
        title: offer.title,
        steamAppId: offer.steamAppId,
        imageUrl: offer.imageUrl,
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
      data: { status: "success", itemCount: offers.length, completedAt: new Date() },
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

export async function getGameDetail(rawExternalId: string): Promise<{
  game: ProviderGameDetail;
  offers: SearchResult["offers"];
} | null> {
  const externalId = externalIdSchema.parse(rawExternalId);
  const provider = getCheapSharkProvider();
  const [game, stores] = await Promise.all([provider.getGame(externalId), provider.getStores()]);
  if (!game) return null;

  const persistedIds = await persistOffers(game.offers, stores);
  const storeNames = new Map(stores.map((store) => [store.externalId, store.name]));
  return {
    game,
    offers: game.offers
      .map((offer) => ({
        ...offer,
        storeName: storeNames.get(offer.externalStoreId) ?? "Neznámý obchod",
        persistedId: persistedIds.get(offer.externalOfferId) ?? null,
      }))
      .sort((a, b) => a.price.minor - b.price.minor),
  };
}
