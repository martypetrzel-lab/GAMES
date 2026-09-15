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
