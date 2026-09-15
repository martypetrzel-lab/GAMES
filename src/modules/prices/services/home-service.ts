import "server-only";

import { getPrisma } from "@/lib/db/prisma";

export async function getHomeHighlights() {
  const db = getPrisma();
  const [offers, recentRuns] = await Promise.all([
    db.offer.findMany({
      where: {
        store: { isActive: true },
        AND: [
          { store: { trustStatus: "verified" } },
          { store: { OR: [{ isFirstParty: true }, { isAuthorized: true }] } },
        ],
        game: { providerGames: { some: { provider: "cheapshark" } } },
      },
      orderBy: [{ savingsPercent: "desc" }, { priceMinor: "asc" }],
      take: 18,
      include: {
        game: { include: { providerGames: { where: { provider: "cheapshark" }, take: 1 } } },
        store: true,
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
