import type {
  ProviderGameDetail,
  ProviderOffer,
  ProviderStore,
} from "@/modules/prices/domain/types";

export interface PriceProvider {
  readonly id: string;
  searchOffers(query: string): Promise<ProviderOffer[]>;
  getGame(externalGameId: string): Promise<ProviderGameDetail | null>;
  getStores(): Promise<ProviderStore[]>;
}
