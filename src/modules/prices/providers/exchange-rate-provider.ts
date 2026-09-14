import type { ExchangeRateQuote } from "@/modules/prices/domain/types";

export interface ExchangeRateProvider {
  readonly id: string;
  getUsdCzkRate(): Promise<ExchangeRateQuote>;
}
