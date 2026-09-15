import type { Metadata } from "next";
import Link from "next/link";

import { AdSlot } from "@/components/ads/ad-slot";
import { RateNote } from "@/components/deals/rate-note";
import { GameCard } from "@/components/games/game-card";
import { SearchForm } from "@/components/games/search-form";
import {
  filterAndSortGames,
  type SearchFilters,
  type SearchSort,
} from "@/modules/prices/domain/search-controls";
import { getUsdCzkRate } from "@/modules/prices/services/exchange-rate-service";
import { searchGames } from "@/modules/prices/services/price-service";
import { ProviderError } from "@/modules/prices/providers/provider-error";
import type { ExchangeRateQuote, SearchResult } from "@/modules/prices/domain/types";

export const metadata: Metadata = { title: "Hledat hry", robots: { index: false, follow: true } };
const pageSize = 8;

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}
function number(value: string | undefined, factor = 1) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed >= 0 ? Math.round(parsed * factor) : undefined;
}

export default async function SearchPage({ searchParams }: PageProps<"/hledat">) {
  const params = await searchParams;
  const query = one(params.q)?.trim() ?? "";
  const isValid = query.length >= 2 && query.length <= 80;
  const sortValue = one(params.sort);
  const sort: SearchSort = ["price", "discount", "name", "updated"].includes(sortValue ?? "")
    ? (sortValue as SearchSort)
    : "price";
  const filters: SearchFilters = {
    sort,
    store: one(params.store) || undefined,
    minDiscount: number(one(params.discount)),
    minPrice: number(one(params.minPrice), 100),
    maxPrice: number(one(params.maxPrice), 100),
    activation:
      one(params.activation) === "steam" || one(params.activation) === "unknown"
        ? (one(params.activation) as "steam" | "unknown")
        : undefined,
  };
  const page = Math.max(1, number(one(params.page)) ?? 1);
  let rawResults: SearchResult[] = [];
  let rate: ExchangeRateQuote | null = null;
  let failure: "provider" | "rate-limit" | "database" | null = null;
  if (isValid) {
    try {
      [rawResults, rate] = await Promise.all([searchGames(query), getUsdCzkRate()]);
    } catch (error) {
      failure =
        error instanceof ProviderError
          ? error.code === "rate-limited"
            ? "rate-limit"
            : "provider"
          : typeof (error as { code?: unknown })?.code === "string"
            ? "database"
            : "provider";
    }
  }
  const results = filterAndSortGames(rawResults, filters);
  const stores = [
    ...new Map(
      rawResults.flatMap((game) =>
        game.offers.map((offer) => [offer.externalStoreId, offer.storeName] as const),
      ),
    ).entries(),
  ].sort((a, b) => a[1].localeCompare(b[1], "cs"));
  const totalOffers = results.reduce((sum, game) => sum + game.offers.length, 0);
  const pages = Math.max(1, Math.ceil(results.length / pageSize));
  const visible = results.slice(
    (Math.min(page, pages) - 1) * pageSize,
    Math.min(page, pages) * pageSize,
  );
  const activeCount =
    Object.entries(filters).filter(([key, value]) => key !== "sort" && value !== undefined).length +
    (sort !== "price" ? 1 : 0);

  return (
    <section className="search-page shell">
      <div className="search-page-heading">
        <p className="kicker">Vyhledávání</p>
        <h1>
          {query ? (
            <>
              Výsledky pro <em>„{query}“</em>
            </>
          ) : (
            "Najděte svoji další hru"
          )}
        </h1>
        <SearchForm defaultValue={query} />
      </div>
      {isValid && <RateNote rate={rate} />}
      {!query && (
        <EmptyState
          title="Začněte názvem hry"
          text="Zadejte alespoň dva znaky. Porovnáme dostupné nabídky digitálních obchodů."
        />
      )}
      {query && !isValid && (
        <EmptyState title="Upřesněte hledání" text="Hledaný výraz musí mít 2 až 80 znaků." />
      )}
      {failure && (
        <div className="inline-error" role="alert">
          <strong>
            {failure === "rate-limit"
              ? "Příliš mnoho požadavků"
              : failure === "database"
                ? "Databáze je dočasně nedostupná"
                : "Cenový zdroj je dočasně nedostupný"}
          </strong>
          <p>
            {failure === "rate-limit"
              ? "Počkejte prosím chvíli a zkuste hledání znovu."
              : "Zkuste to prosím za okamžik znovu."}
          </p>
        </div>
      )}
      {isValid && !failure && (
        <div className="search-layout">
          <details className="filter-panel" open>
            <summary>Filtry a řazení {activeCount > 0 && <span>{activeCount}</span>}</summary>
            <form action="/hledat">
              <input type="hidden" name="q" value={query} />
              <label>
                Řazení
                <select name="sort" defaultValue={sort}>
                  <option value="price">Nejnižší cena</option>
                  <option value="discount">Nejvyšší sleva</option>
                  <option value="name">Název hry</option>
                  <option value="updated">Poslední aktualizace</option>
                </select>
              </label>
              <label>
                Obchod
                <select name="store" defaultValue={filters.store ?? ""}>
                  <option value="">Všechny obchody</option>
                  {stores.map(([id, name]) => (
                    <option key={id} value={id}>
                      {name}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Minimální sleva
                <select name="discount" defaultValue={filters.minDiscount ?? ""}>
                  <option value="">Libovolná</option>
                  <option value="20">20 %</option>
                  <option value="40">40 %</option>
                  <option value="60">60 %</option>
                  <option value="80">80 %</option>
                </select>
              </label>
              <fieldset>
                <legend>Cena v USD</legend>
                <div className="price-range">
                  <input
                    aria-label="Minimální cena v USD"
                    name="minPrice"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Od"
                    defaultValue={one(params.minPrice)}
                  />
                  <input
                    aria-label="Maximální cena v USD"
                    name="maxPrice"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Do"
                    defaultValue={one(params.maxPrice)}
                  />
                </div>
              </fieldset>
              <label>
                Aktivace
                <select name="activation" defaultValue={filters.activation ?? ""}>
                  <option value="">Všechny</option>
                  <option value="steam">Přímý nákup na Steamu</option>
                  <option value="unknown">Aktivace neuvedena</option>
                </select>
              </label>
              <button className="button" type="submit">
                Použít filtry
              </button>
              <Link className="clear-filters" href={`/hledat?q=${encodeURIComponent(query)}`}>
                Vymazat filtry
              </Link>
            </form>
          </details>
          <div className="results-column">
            <div className="result-count">
              <strong>{results.length}</strong> her · <strong>{totalOffers}</strong> nabídek{" "}
              {activeCount > 0 && <span>· aktivních filtrů: {activeCount}</span>}
            </div>
            {isValid && results.length === 0 ? (
              <EmptyState
                title="Nic jsme nenašli"
                text="Zkuste změnit filtry, kratší název hry nebo zkontrolujte překlep."
              />
            ) : (
              <div className="results">
                {visible.map((game) => (
                  <GameCard key={game.externalGameId} game={game} rate={rate} />
                ))}
              </div>
            )}
            {pages > 1 && (
              <nav className="pagination" aria-label="Stránkování výsledků">
                {Array.from({ length: pages }, (_, i) => {
                  const target = i + 1;
                  const url = new URLSearchParams(
                    Object.entries(params).flatMap(([key, value]) =>
                      value === undefined ? [] : [[key, one(value)!]],
                    ),
                  );
                  url.set("page", String(target));
                  return (
                    <Link
                      aria-current={target === page ? "page" : undefined}
                      href={`/hledat?${url}`}
                      key={target}
                    >
                      {target}
                    </Link>
                  );
                })}
              </nav>
            )}
            <AdSlot placement="search-inline" />
          </div>
        </div>
      )}
    </section>
  );
}

function EmptyState({ title, text }: { title: string; text: string }) {
  return (
    <div className="empty-state">
      <span aria-hidden="true">⌕</span>
      <h2>{title}</h2>
      <p>{text}</p>
    </div>
  );
}
