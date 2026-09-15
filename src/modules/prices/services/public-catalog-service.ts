import "server-only";

import { unstable_cache } from "next/cache";

import type { ProductType } from "@/generated/prisma/enums";
import type { Prisma } from "@/generated/prisma/client";
import { getPrisma } from "@/lib/db/prisma";
import { measureServerOperation } from "@/lib/observability/server-log";
import type { SearchResult } from "@/modules/prices/domain/types";
import type { Currency } from "@/lib/money/money";
import { PUBLIC_CACHE_TAGS } from "@/modules/prices/services/public-cache-policy";

const publicOfferWhere: Prisma.OfferWhereInput = {
  store: {
    isActive: true,
    trustStatus: "verified",
    OR: [{ isFirstParty: true }, { isAuthorized: true }],
  },
};

function effectiveType(game: {
  productType: ProductType;
  productTypeOverride: ProductType | null;
}) {
  return game.productTypeOverride ?? game.productType;
}

async function queryStoredGames(query: string): Promise<SearchResult[]> {
  return measureServerOperation("database", "catalog-search", async () => {
    const games = await getPrisma().game.findMany({
      where: {
        catalogActive: true,
        title: { contains: query, mode: "insensitive" },
        offers: { some: publicOfferWhere },
      },
      orderBy: [{ popularityScore: "desc" }, { title: "asc" }],
      take: 40,
      select: {
        slug: true,
        title: true,
        steamAppId: true,
        imageUrl: true,
        productType: true,
        productTypeOverride: true,
        providerGames: {
          where: { provider: "cheapshark" },
          take: 1,
          select: { externalId: true },
        },
        offers: {
          where: publicOfferWhere,
          orderBy: { priceMinor: "asc" },
          take: 20,
          select: {
            id: true,
            provider: true,
            externalId: true,
            priceMinor: true,
            regularPriceMinor: true,
            currency: true,
            savingsPercent: true,
            targetUrl: true,
            observedAt: true,
            store: { select: { externalId: true, name: true } },
          },
        },
      },
    });
    return games.flatMap((game) => {
      const externalGameId = game.providerGames[0]?.externalId;
      if (!externalGameId) return [];
      return [
        {
          externalGameId,
          title: game.title,
          steamAppId: game.steamAppId,
          imageUrl: game.imageUrl,
          slug: game.slug,
          productType: effectiveType(game),
          offers: game.offers.map((offer) => ({
            provider: offer.provider,
            externalOfferId: offer.externalId,
            externalGameId,
            externalStoreId: offer.store.externalId,
            title: game.title,
            steamAppId: game.steamAppId,
            imageUrl: game.imageUrl,
            price: { minor: offer.priceMinor, currency: offer.currency as Currency },
            regularPrice: { minor: offer.regularPriceMinor, currency: offer.currency as Currency },
            savingsPercent: offer.savingsPercent,
            observedAt: offer.observedAt,
            targetUrl: offer.targetUrl,
            storeName: offer.store.name,
            persistedId: offer.id,
          })),
        },
      ];
    });
  });
}

const getCachedStoredGames = unstable_cache(queryStoredGames, ["catalog-search-v1"], {
  revalidate: 300,
  tags: [PUBLIC_CACHE_TAGS.catalog, PUBLIC_CACHE_TAGS.offers],
});

export async function searchStoredGames(query: string): Promise<SearchResult[]> {
  const games = await getCachedStoredGames(query);
  return games.map((game) => ({
    ...game,
    offers: game.offers.map((offer) => ({ ...offer, observedAt: new Date(offer.observedAt) })),
  }));
}

async function queryStoredGameBySlug(slug: string) {
  return measureServerOperation("database", "game-detail", () =>
    getPrisma().game.findFirst({
      where: { OR: [{ slug }, { slugAliases: { some: { slug } } }], catalogActive: true },
      select: {
        id: true,
        slug: true,
        title: true,
        steamAppId: true,
        imageUrl: true,
        updatedAt: true,
        productType: true,
        productTypeOverride: true,
        providerGames: { where: { provider: "cheapshark" }, take: 1, select: { externalId: true } },
        offers: {
          where: publicOfferWhere,
          orderBy: { priceMinor: "asc" },
          take: 50,
          select: {
            id: true,
            provider: true,
            externalId: true,
            priceMinor: true,
            regularPriceMinor: true,
            currency: true,
            savingsPercent: true,
            targetUrl: true,
            observedAt: true,
            store: { select: { externalId: true, name: true } },
          },
        },
      },
    }),
  );
}

const getCachedStoredGameBySlug = unstable_cache(queryStoredGameBySlug, ["game-detail-v1"], {
  revalidate: 300,
  tags: [PUBLIC_CACHE_TAGS.catalog, PUBLIC_CACHE_TAGS.offers],
});

export async function getStoredGameBySlug(slug: string) {
  const game = await getCachedStoredGameBySlug(slug);
  return game
    ? {
        ...game,
        updatedAt: new Date(game.updatedAt),
        offers: game.offers.map((offer) => ({ ...offer, observedAt: new Date(offer.observedAt) })),
      }
    : null;
}

export async function getCanonicalSlugForProvider(provider: string, externalId: string) {
  const row = await getPrisma().providerGame.findUnique({
    where: { provider_externalId: { provider, externalId } },
    select: { game: { select: { slug: true } } },
  });
  return row?.game.slug ?? null;
}

export function mapStoredDetail(
  game: NonNullable<Awaited<ReturnType<typeof getStoredGameBySlug>>>,
) {
  const externalGameId = game.providerGames[0]?.externalId ?? "";
  return {
    internal: {
      id: game.id,
      slug: game.slug,
      updatedAt: game.updatedAt,
      productType: effectiveType(game),
    },
    game: {
      provider: "cheapshark",
      externalGameId,
      title: game.title,
      steamAppId: game.steamAppId,
      imageUrl: game.imageUrl,
      externalHistoricalLow: null,
      externalHistoricalLowAt: null,
    },
    offers: game.offers.map((offer) => ({
      provider: offer.provider,
      externalOfferId: offer.externalId,
      externalGameId,
      externalStoreId: offer.store.externalId,
      title: game.title,
      steamAppId: game.steamAppId,
      imageUrl: game.imageUrl,
      price: { minor: offer.priceMinor, currency: offer.currency as Currency },
      regularPrice: { minor: offer.regularPriceMinor, currency: offer.currency as Currency },
      savingsPercent: offer.savingsPercent,
      observedAt: offer.observedAt,
      targetUrl: offer.targetUrl,
      storeName: offer.store.name,
      persistedId: offer.id,
    })),
  };
}
