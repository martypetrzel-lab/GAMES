import { getPrisma } from "../src/lib/db/prisma";
import { logServerError } from "../src/lib/observability/server-log";
import { getGameDetail } from "../src/modules/prices/services/price-service";

const limit = Math.min(25, Math.max(1, Number(process.env.PRICE_REFRESH_BATCH_SIZE) || 10));
const staleBefore = new Date(Date.now() - 12 * 60 * 60 * 1_000);
const db = getPrisma();

async function main() {
  const games = await db.providerGame.findMany({
    where: {
      provider: "cheapshark",
      game: { offers: { some: { updatedAt: { lt: staleBefore } } } },
    },
    orderBy: { updatedAt: "asc" },
    take: limit,
    select: { externalId: true },
  });

  let completed = 0;
  for (const game of games) {
    try {
      await getGameDetail(game.externalId);
      completed += 1;
    } catch (error) {
      logServerError("cron", error, { operation: "refresh-game", gameId: game.externalId });
    }
    await new Promise((resolve) => setTimeout(resolve, 750));
  }

  console.info(
    JSON.stringify({
      level: "info",
      event: "price-refresh-complete",
      selected: games.length,
      completed,
      timestamp: new Date().toISOString(),
    }),
  );
}

try {
  await main();
} catch (error) {
  logServerError("cron", error, { operation: "refresh-batch" });
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
