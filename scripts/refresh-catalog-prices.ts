import { getServerEnv } from "../src/config/env";
import { getPrisma } from "../src/lib/db/prisma";
import { logServerError } from "../src/lib/observability/server-log";
import { ProviderError } from "../src/modules/prices/providers/provider-error";
import { getGameDetail } from "../src/modules/prices/services/price-service";
const db = getPrisma();
const env = getServerEnv();
async function main() {
  const lock = await db.$queryRaw<
    Array<{ locked: boolean }>
  >`SELECT pg_try_advisory_lock(704233) AS locked`;
  if (!lock[0]?.locked) {
    console.info(
      JSON.stringify({
        level: "info",
        event: "catalog-price-refresh-skipped",
        reason: "lock-held",
      }),
    );
    return;
  }
  const run = await db.catalogSyncRun.create({
    data: { provider: "cheapshark-price", status: "running" },
  });
  try {
    const candidates = await db.providerGame.findMany({
      where: { provider: "cheapshark", game: { catalogActive: true } },
      take: env.PRICE_REFRESH_BATCH_SIZE * 4,
      include: {
        game: {
          include: {
            wishlistItems: { include: { alerts: { where: { enabled: true }, take: 1 } }, take: 1 },
            offers: { orderBy: [{ savingsPercent: "desc" }, { updatedAt: "asc" }], take: 1 },
          },
        },
      },
    });
    const ranked = candidates
      .map((c) => ({
        externalId: c.externalId,
        score:
          (c.game.wishlistItems[0]?.alerts.length
            ? 1_000_000
            : c.game.wishlistItems.length
              ? 500_000
              : 0) +
          c.game.popularityScore * 100 +
          (c.game.offers[0]?.savingsPercent ?? 0) * 10 -
          Math.floor((c.game.offers[0]?.updatedAt.getTime() ?? 0) / 1e9),
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, env.PRICE_REFRESH_BATCH_SIZE);
    let checked = 0,
      failed = 0;
    for (const item of ranked) {
      let last: unknown;
      for (let attempt = 0; attempt < 3; attempt++) {
        try {
          await getGameDetail(item.externalId);
          last = null;
          checked++;
          break;
        } catch (e) {
          last = e;
          if (e instanceof ProviderError && e.code === "rate-limited") throw e;
          if (attempt < 2) await new Promise((r) => setTimeout(r, 1000 * 2 ** attempt));
        }
      }
      if (last) {
        failed++;
        logServerError("catalog", last, {
          operation: "refresh-catalog-game",
          gameId: item.externalId,
        });
      }
      await new Promise((r) => setTimeout(r, env.CATALOG_REQUEST_DELAY_MS));
    }
    await db.catalogSyncRun.update({
      where: { id: run.id },
      data: {
        status: failed ? "partial" : "success",
        fetched: ranked.length,
        imported: checked,
        skipped: failed,
        completedAt: new Date(),
      },
    });
  } catch (e) {
    await db.catalogSyncRun.update({
      where: { id: run.id },
      data: {
        status: e instanceof ProviderError && e.code === "rate-limited" ? "rate_limited" : "failed",
        errorMessage: e instanceof Error ? e.message.slice(0, 300) : "Neznámá chyba",
        completedAt: new Date(),
      },
    });
    throw e;
  } finally {
    await db.$queryRaw`SELECT pg_advisory_unlock(704233)`;
  }
}
try {
  await main();
} catch (e) {
  logServerError("catalog", e, { operation: "catalog-price-refresh" });
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
