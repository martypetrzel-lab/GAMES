import "server-only";

import { getPrisma } from "@/lib/db/prisma";
import type { ExchangeRateQuote } from "@/modules/prices/domain/types";
import { getCnbProvider } from "@/modules/prices/providers/provider-registry";
import { logServerError } from "@/lib/observability/server-log";

const MAX_RATE_AGE_MS = 24 * 60 * 60 * 1_000;

function fromDatabase(rate: {
  provider: string;
  rate: { toString(): string };
  sourceAmount: number;
  validFor: Date;
  fetchedAt: Date;
}): ExchangeRateQuote {
  return {
    provider: rate.provider,
    baseCurrency: "USD",
    quoteCurrency: "CZK",
    rate: rate.rate.toString(),
    sourceAmount: rate.sourceAmount,
    validFor: rate.validFor,
    fetchedAt: rate.fetchedAt,
  };
}

export async function getUsdCzkRate(): Promise<ExchangeRateQuote | null> {
  const db = getPrisma();
  const latest = await db.exchangeRate.findFirst({
    where: { provider: "cnb", baseCurrency: "USD", quoteCurrency: "CZK" },
    orderBy: [{ validFor: "desc" }, { fetchedAt: "desc" }],
  });

  if (latest && latest.fetchedAt.getTime() >= Date.now() - MAX_RATE_AGE_MS) {
    return fromDatabase(latest);
  }

  try {
    const fresh = await getCnbProvider().getUsdCzkRate();
    const saved = await db.exchangeRate.upsert({
      where: {
        provider_baseCurrency_quoteCurrency_validFor: {
          provider: fresh.provider,
          baseCurrency: fresh.baseCurrency,
          quoteCurrency: fresh.quoteCurrency,
          validFor: fresh.validFor,
        },
      },
      create: {
        provider: fresh.provider,
        baseCurrency: fresh.baseCurrency,
        quoteCurrency: fresh.quoteCurrency,
        rate: fresh.rate,
        sourceAmount: fresh.sourceAmount,
        validFor: fresh.validFor,
        fetchedAt: fresh.fetchedAt,
      },
      update: { rate: fresh.rate, sourceAmount: fresh.sourceAmount, fetchedAt: fresh.fetchedAt },
    });
    return fromDatabase(saved);
  } catch (error) {
    logServerError("cnb", error, { operation: "usd-czk-rate", provider: "cnb" });
    return latest ? fromDatabase(latest) : null;
  }
}
