import Decimal from "decimal.js";

import type { ExchangeRateQuote } from "@/modules/prices/domain/types";
import type { ExchangeRateProvider } from "@/modules/prices/providers/exchange-rate-provider";
import { ProviderError } from "@/modules/prices/providers/provider-error";
import { cnbDailyRatesSchema } from "@/modules/prices/providers/cnb/schemas";

type CnbProviderOptions = {
  baseUrl?: string;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
  now?: () => Date;
};

export class CnbExchangeRateProvider implements ExchangeRateProvider {
  readonly id = "cnb";
  private readonly baseUrl: string;
  private readonly fetchImpl: typeof fetch;
  private readonly timeoutMs: number;
  private readonly now: () => Date;

  constructor(options: CnbProviderOptions = {}) {
    this.baseUrl = options.baseUrl ?? "https://api.cnb.cz/cnbapi";
    this.fetchImpl = options.fetchImpl ?? fetch;
    this.timeoutMs = options.timeoutMs ?? 5_000;
    this.now = options.now ?? (() => new Date());
  }

  async getUsdCzkRate(): Promise<ExchangeRateQuote> {
    const url = new URL(`${this.baseUrl}/exrates/daily`);
    url.searchParams.set("lang", "EN");

    let response: Response;
    try {
      response = await this.fetchImpl(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(this.timeoutMs),
        cache: "no-store",
      });
    } catch (error) {
      const timedOut = error instanceof DOMException && error.name === "TimeoutError";
      throw new ProviderError(
        timedOut ? "ČNB neodpověděla včas." : "Kurzovní lístek ČNB je nedostupný.",
        this.id,
        timedOut ? "timeout" : "unavailable",
        { cause: error },
      );
    }

    if (response.status === 429) {
      throw new ProviderError("ČNB dočasně omezila počet požadavků.", this.id, "rate-limited");
    }
    if (!response.ok) {
      throw new ProviderError(`ČNB odpověděla stavem ${response.status}.`, this.id, "unavailable");
    }

    const parsed = cnbDailyRatesSchema.safeParse(await response.json());
    const usd = parsed.success
      ? parsed.data.rates.find((item) => item.currencyCode === "USD")
      : undefined;
    if (!usd) {
      throw new ProviderError(
        "Kurzovní lístek ČNB neobsahuje platný kurz USD.",
        this.id,
        "invalid-response",
      );
    }

    const perUnit = new Decimal(usd.rate).div(usd.amount).toDecimalPlaces(8).toFixed();
    return {
      provider: this.id,
      baseCurrency: "USD",
      quoteCurrency: "CZK",
      rate: perUnit,
      sourceAmount: usd.amount,
      validFor: new Date(`${usd.validFor}T00:00:00.000Z`),
      fetchedAt: this.now(),
    };
  }
}
