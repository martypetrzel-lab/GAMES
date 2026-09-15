import { getServerEnv } from "../src/config/env";
import { getPrisma } from "../src/lib/db/prisma";
import { convertUsdCentsToCzkHalere } from "../src/lib/money/money";
import { logServerError } from "../src/lib/observability/server-log";
import { evaluateAlert, notificationDeduplicationKey } from "../src/modules/alerts/domain";
import { getEmailProvider } from "../src/modules/email/provider";
import { priceAlertEmail } from "../src/modules/email/templates";
import { getUsdCzkRate } from "../src/modules/prices/services/exchange-rate-service";
import { getGameDetail } from "../src/modules/prices/services/price-service";

const db = getPrisma();
const env = getServerEnv();
async function retry<T>(fn: () => Promise<T>, attempts = 3) {
  let error: unknown;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      error = e;
      if (i < attempts - 1) await new Promise((r) => setTimeout(r, 750 * 2 ** i));
    }
  }
  throw error;
}
async function main() {
  const lock = await db.$queryRaw<
    Array<{ locked: boolean }>
  >`SELECT pg_try_advisory_lock(704231) AS locked`;
  if (!lock[0]?.locked) {
    console.info(
      JSON.stringify({ level: "info", event: "alert-check-skipped", reason: "lock-held" }),
    );
    return;
  }
  const run = await db.alertCheckRun.create({ data: { status: "running", lockKey: "alerts-v1" } });
  try {
    const watched = await db.providerGame.findMany({
      where: {
        provider: "cheapshark",
        game: { wishlistItems: { some: { alerts: { some: { enabled: true } } } } },
      },
      orderBy: { updatedAt: "asc" },
      take: env.CRON_BATCH_SIZE,
      select: { externalId: true, gameId: true },
    });
    await db.alertCheckRun.update({ where: { id: run.id }, data: { selected: watched.length } });
    let checked = 0,
      triggered = 0,
      failed = 0;
    for (const watchedGame of watched) {
      try {
        await retry(() => getGameDetail(watchedGame.externalId));
        const [rate, game] = await Promise.all([
          getUsdCzkRate(),
          db.game.findUniqueOrThrow({
            where: { id: watchedGame.gameId },
            include: {
              offers: { orderBy: { priceMinor: "asc" }, take: 1 },
              wishlistItems: { include: { alerts: { where: { enabled: true } }, user: true } },
            },
          }),
        ]);
        const best = game.offers[0];
        if (!best || !rate) continue;
        const previous = await db.priceObservation.aggregate({
          where: { offer: { gameId: game.id }, observedAt: { lt: best.observedAt } },
          _min: { priceMinor: true },
        });
        const czk = convertUsdCentsToCzkHalere(best.priceMinor, rate.rate);
        for (const item of game.wishlistItems)
          for (const alert of item.alerts) {
            const result = evaluateAlert(alert, {
              czkMinor: czk,
              usdMinor: best.priceMinor,
              previousOwnMinimum: previous._min.priceMinor,
              now: new Date(),
            });
            await db.priceAlert.update({
              where: { id: alert.id },
              data: { lastCheckedAt: new Date() },
            });
            if (!result.triggered || !result.reason) continue;
            const key = notificationDeduplicationKey(alert.id, result.reason, best.priceMinor);
            const message =
              result.reason === "target"
                ? `${game.title} klesl na přibližně ${(czk / 100).toFixed(2)} Kč. Vaše cílová cena je ${((alert.targetPriceMinor ?? 0) / 100).toFixed(2)} Kč.`
                : `${game.title} dosáhl nového vlastního historického minima přibližně ${(czk / 100).toFixed(2)} Kč.`;
            try {
              await db.notification.create({
                data: {
                  userId: item.userId,
                  priceAlertId: alert.id,
                  deduplicationKey: key,
                  type: result.reason,
                  title: game.title,
                  message,
                  gameId: game.id,
                  priceMinor: czk,
                  currency: "CZK",
                  targetPriceMinor: alert.targetPriceMinor,
                  exchangeRateDate: rate.validFor,
                  usdPriceMinor: best.priceMinor,
                  status: "pending",
                },
              });
              await db.priceAlert.update({
                where: { id: alert.id },
                data: { lastTriggeredAt: new Date() },
              });
              if (env.EMAIL_PROVIDER !== "disabled" && item.user.email) {
                const email = priceAlertEmail({
                  title: game.title,
                  message,
                  manageUrl: `${env.APP_BASE_URL}/cenova-upozorneni`,
                });
                await db.emailOutbox.create({
                  data: {
                    userId: item.userId,
                    notificationId: (
                      await db.notification.findUniqueOrThrow({ where: { deduplicationKey: key } })
                    ).id,
                    template: "price-alert",
                    recipient: item.user.email,
                    payload: email,
                  },
                });
              }
              triggered++;
            } catch (e) {
              if ((e as { code?: string }).code !== "P2002") throw e;
            }
          }
        checked++;
        await new Promise((r) => setTimeout(r, 750));
      } catch (e) {
        failed++;
        logServerError("cron", e, {
          operation: "check-watched-game",
          gameId: watchedGame.externalId,
        });
      }
    }
    await db.alertCheckRun.update({
      where: { id: run.id },
      data: {
        status: failed ? "partial" : "success",
        checked,
        triggered,
        failed,
        completedAt: new Date(),
      },
    });
    const provider = getEmailProvider();
    if (provider.id !== "disabled") {
      const outbox = await db.emailOutbox.findMany({
        where: {
          status: { in: ["pending", "failed"] },
          nextAttemptAt: { lte: new Date() },
          attempts: { lt: 5 },
        },
        take: 20,
      });
      for (const item of outbox) {
        try {
          const p = item.payload as { subject: string; text: string; html: string };
          const sent = await provider.send({ ...p, to: item.recipient, idempotencyKey: item.id });
          await db.emailOutbox.update({
            where: { id: item.id },
            data: {
              status: "sent",
              attempts: { increment: 1 },
              lastAttemptAt: new Date(),
              providerMessageId: sent.id,
            },
          });
        } catch (e) {
          await db.emailOutbox.update({
            where: { id: item.id },
            data: {
              status: "failed",
              attempts: { increment: 1 },
              lastAttemptAt: new Date(),
              nextAttemptAt: new Date(Date.now() + 3600000),
              lastError: e instanceof Error ? e.message.slice(0, 300) : "Neznámá chyba",
            },
          });
        }
      }
    }
  } finally {
    await db.$queryRaw`SELECT pg_advisory_unlock(704231)`;
  }
}
try {
  await main();
} catch (e) {
  logServerError("cron", e, { operation: "alerts-check" });
  process.exitCode = 1;
} finally {
  await db.$disconnect();
}
