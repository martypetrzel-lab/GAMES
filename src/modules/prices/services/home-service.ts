import "server-only";

import { getPrisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";
import { PUBLIC_CACHE_TAGS } from "@/modules/prices/services/public-cache-policy";

async function queryHomeHighlights() {
  const db = getPrisma();
  const [offers, recentRuns] = await Promise.all([
    db.offer.findMany({
      where: {
        store: { isActive: true },
        AND: [
          { store: { trustStatus: "verified" } },
          { store: { OR: [{ isFirstParty: true }, { isAuthorized: true }] } },
        ],
        game: {
          catalogActive: true,
          providerGames: { some: { provider: "cheapshark" } },
          OR: [{ productTypeOverride: "GAME" }, { productTypeOverride: null, productType: "GAME" }],
        },
      },
      orderBy: [{ savingsPercent: "desc" }, { priceMinor: "asc" }],
      take: 18,
      include: {
        game: {
          select: {
            slug: true,
            title: true,
            imageUrl: true,
            providerGames: {
              where: { provider: "cheapshark" },
              take: 1,
              select: { externalId: true },
            },
          },
        },
        store: { select: { name: true } },
      },
    }),
    db.providerRun.findMany({
      where: { status: "success", query: { not: null } },
      orderBy: { completedAt: "desc" },
      distinct: ["query"],
      take: 6,
      select: { query: true },
    }),
  ]);

  const interesting = [...offers].sort((a, b) => a.priceMinor - b.priceMinor).slice(0, 4);
  const discounts = offers.filter((offer) => offer.savingsPercent > 0).slice(0, 4);
  return { interesting, discounts, recentQueries: recentRuns.flatMap((run) => run.query ?? []) };
}

export const getHomeHighlights = unstable_cache(queryHomeHighlights, ["home-highlights-v2"], {
  revalidate: 300,
  tags: [PUBLIC_CACHE_TAGS.home, PUBLIC_CACHE_TAGS.offers],
});
