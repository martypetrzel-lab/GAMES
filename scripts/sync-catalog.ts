import { getServerEnv } from "../src/config/env";
import { getPrisma } from "../src/lib/db/prisma";
import { logServerError } from "../src/lib/observability/server-log";
import {
  SteamCatalogError,
  SteamCatalogProvider,
} from "../src/modules/catalog/steam/steam-catalog-provider";
import { stableGameSlug } from "../src/modules/catalog/slug";
const db = getPrisma();
const env = getServerEnv();
const started = Date.now();
async function main() {
  if (!env.CATALOG_SYNC_ENABLED) {
    console.info(JSON.stringify({ level: "info", event: "catalog-sync-disabled" }));
    return;
  }
  if (!env.STEAM_API_KEY) throw new Error("STEAM_API_KEY je povinný pro catalog:sync.");
  const lock = await db.$queryRaw<
    Array<{ locked: boolean }>
  >`SELECT pg_try_advisory_lock(704232) AS locked`;
  if (!lock[0]?.locked) {
    console.info(
      JSON.stringify({ level: "info", event: "catalog-sync-skipped", reason: "lock-held" }),
    );
    return;
  }
  try {
    const checkpoint = await db.catalogSyncCheckpoint.upsert({
      where: { provider: "steam" },
      create: { provider: "steam" },
      update: {},
    });
    const run = await db.catalogSyncRun.create({
      data: { provider: "steam", status: "running", cursorStart: checkpoint.cursor },
    });
    let cursor = checkpoint.cursor,
      fetched = 0,
      imported = 0,
      pages = 0;
    const provider = new SteamCatalogProvider(env.STEAM_API_KEY);
    try {
      while (
        pages < env.CATALOG_MAX_PAGES_PER_RUN &&
        Date.now() - started < env.CATALOG_MAX_RUNTIME_MINUTES * 60000
      ) {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), 15000);
        let page;
        try {
          page = await provider.getApps(cursor, env.CATALOG_SYNC_BATCH_SIZE, controller.signal);
        } finally {
          clearTimeout(timeout);
        }
        fetched += page.apps.length;
        for (const app of page.apps) {
          await db.$transaction(async (tx) => {
            const existing = await tx.game.findFirst({ where: { steamAppId: String(app.appId) } });
            const game = existing
              ? await tx.game.update({
                  where: { id: existing.id },
                  data: {
                    title: app.name,
                    appType: app.appType,
                    catalogSource: "steam",
                    catalogSyncedAt: new Date(),
                    catalogActive: true,
                    priceChangeNumber:
                      app.priceChangeNumber === null ? null : BigInt(app.priceChangeNumber),
                    ...(existing.productTypeOverride
                      ? {}
                      : { productType: "GAME" as const, productTypeSource: "steam-api-type" }),
                  },
                })
              : await tx.game.create({
                  data: {
                    slug: (await tx.game.findUnique({
                      where: { slug: stableGameSlug(app.name) },
                      select: { id: true },
                    }))
                      ? stableGameSlug(app.name, `steam:${app.appId}`)
                      : stableGameSlug(app.name),
                    title: app.name,
                    steamAppId: String(app.appId),
                    appType: app.appType,
                    catalogSource: "steam",
                    catalogSyncedAt: new Date(),
                    priceChangeNumber:
                      app.priceChangeNumber === null ? null : BigInt(app.priceChangeNumber),
                    productType: "GAME",
                    productTypeSource: "steam-api-type",
                  },
                });
            await tx.providerGame.upsert({
              where: {
                provider_externalId: { provider: "steam-catalog", externalId: String(app.appId) },
              },
              create: { provider: "steam-catalog", externalId: String(app.appId), gameId: game.id },
              update: { gameId: game.id },
            });
          });
          imported++;
        }
        cursor = page.nextCursor;
        await db.catalogSyncCheckpoint.update({
          where: { provider: "steam" },
          data: {
            cursor: cursor ?? null,
            ...(!page.hasMore
              ? {
                  completedCycleAt: new Date(),
                  modifiedSince: BigInt(Math.floor(Date.now() / 1000)),
                  cursor: null,
                }
              : {}),
          },
        });
        pages++;
        if (!page.hasMore) break;
        await new Promise((r) => setTimeout(r, env.CATALOG_REQUEST_DELAY_MS));
      }
      await db.catalogSyncRun.update({
        where: { id: run.id },
        data: { status: "success", cursorEnd: cursor, fetched, imported, completedAt: new Date() },
      });
      console.info(
        JSON.stringify({
          level: "info",
          event: "catalog-sync-complete",
          fetched,
          imported,
          pages,
          durationMs: Date.now() - started,
          timestamp: new Date().toISOString(),
        }),
      );
    } catch (error) {
      await db.catalogSyncRun.update({
        where: { id: run.id },
        data: {
          status:
            error instanceof SteamCatalogError && error.status === 429 ? "rate_limited" : "failed",
          cursorEnd: cursor,
          fetched,
          imported,
          errorMessage: error instanceof Error ? error.message.slice(0, 300) : "Neznámá chyba",
          completedAt: new Date(),
        },
      });
      throw error;
    }
  } finally {
    await db.$queryRaw`SELECT pg_advisory_unlock(704232)`;
  }
}
try {
  await main();
} catch (e) {
  logServerError("catalog", e, { operation: "catalog-sync" });
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
