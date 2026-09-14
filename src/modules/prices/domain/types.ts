import type { Money } from "@/lib/money/money";

export type ProviderStore = Readonly<{
  externalId: string;
  name: string;
  active: boolean;
  imageUrl: string | null;
}>;

export type ProviderOffer = Readonly<{
  provider: string;
  externalOfferId: string;
  externalGameId: string;
  externalStoreId: string;
  title: string;
  steamAppId: string | null;
  imageUrl: string | null;
  price: Money;
  regularPrice: Money;
  savingsPercent: number;
  observedAt: Date;
  targetUrl: string;
}>;

export type ProviderGameDetail = Readonly<{
  provider: string;
  externalGameId: string;
  title: string;
  steamAppId: string | null;
  imageUrl: string | null;
  offers: ProviderOffer[];
  externalHistoricalLow: Money | null;
  externalHistoricalLowAt: Date | null;
}>;

export type SearchResult = Readonly<{
  externalGameId: string;
  title: string;
  steamAppId: string | null;
  imageUrl: string | null;
  offers: Array<ProviderOffer & { storeName: string; persistedId: string | null }>;
}>;

export type ExchangeRateQuote = Readonly<{
  provider: string;
  baseCurrency: "USD";
  quoteCurrency: "CZK";
  rate: string;
  sourceAmount: number;
  validFor: Date;
  fetchedAt: Date;
}>;
