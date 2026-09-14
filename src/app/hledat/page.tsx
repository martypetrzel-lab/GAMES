import type { Metadata } from "next";

import { RateNote } from "@/components/deals/rate-note";
import { GameCard } from "@/components/games/game-card";
import { SearchForm } from "@/components/games/search-form";
import { getUsdCzkRate } from "@/modules/prices/services/exchange-rate-service";
import { searchGames } from "@/modules/prices/services/price-service";

export const metadata: Metadata = { title: "Hledat hry" };

export default async function SearchPage({ searchParams }: PageProps<"/hledat">) {
  const params = await searchParams;
  const value = Array.isArray(params.q) ? params.q[0] : params.q;
  const query = typeof value === "string" ? value.trim() : "";
  const isValid = query.length >= 2 && query.length <= 80;
  const [results, rate] = isValid
    ? await Promise.all([searchGames(query), getUsdCzkRate()])
    : [[], null];

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
      {isValid && results.length === 0 && (
        <EmptyState
          title="Nic jsme nenašli"
          text="Zkuste kratší název hry nebo zkontrolujte překlep."
        />
      )}
      {results.length > 0 && (
        <div className="results">
          <div className="result-count">
            <span>{results.length}</span>{" "}
            {results.length === 1
              ? "nalezená hra"
              : results.length < 5
                ? "nalezené hry"
                : "nalezených her"}
          </div>
          {results.map((game) => (
            <GameCard key={game.externalGameId} game={game} rate={rate} />
          ))}
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
