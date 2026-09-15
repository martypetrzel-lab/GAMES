import "server-only";

import { getPrisma } from "@/lib/db/prisma";
import { aggregateHistory, rangeStart, type HistoryRange } from "@/modules/prices/domain/history";
import { summarizePrices } from "@/modules/prices/domain/price-analytics";

export async function getGameHistory(externalGameId: string, range: HistoryRange = "all") {
  const db = getPrisma();
  const providerGame = await db.providerGame.findUnique({
    where: { provider_externalId: { provider: "cheapshark", externalId: externalGameId } },
    select: { gameId: true },
  });
  if (!providerGame) return null;

  const from = rangeStart(range);
  const rows = await db.priceObservation.findMany({
    where: {
      offer: { gameId: providerGame.gameId },
      ...(from ? { observedAt: { gte: from } } : {}),
    },
    select: {
      priceMinor: true,
      currency: true,
      observedAt: true,
      offer: { select: { store: { select: { id: true, name: true } } } },
    },
    orderBy: { observedAt: "asc" },
    take: 5_000,
  });
  return aggregateHistory(
    rows.map((row) => ({
      priceMinor: row.priceMinor,
      currency: row.currency,
      observedAt: row.observedAt,
      storeId: row.offer.store.id,
      storeName: row.offer.store.name,
    })),
  );
}

export async function getGamePriceSummary(externalGameId: string) {
  const history = await getGameHistory(externalGameId, "all");
  return summarizePrices(history ?? []);
}

export async function getGamePriceOverview(externalGameId: string) {
  const db = getPrisma();
  const providerGame = await db.providerGame.findUnique({
    where: { provider_externalId: { provider: "cheapshark", externalId: externalGameId } },
    select: { gameId: true },
  });
  if (!providerGame) return null;
  const result = await db.priceObservation.aggregate({
    where: { offer: { gameId: providerGame.gameId }, currency: "USD" },
    _min: { priceMinor: true, observedAt: true },
    _max: { priceMinor: true, observedAt: true },
    _avg: { priceMinor: true },
    _count: { _all: true },
  });
  if (!result._count._all || result._min.priceMinor === null || result._max.priceMinor === null)
    return null;
  return {
    minimum: result._min.priceMinor,
    maximum: result._max.priceMinor,
    average: Math.round(Number(result._avg.priceMinor)),
    count: result._count._all,
    firstObservedAt: result._min.observedAt,
    lastObservedAt: result._max.observedAt,
  };
}
