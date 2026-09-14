import Link from "next/link";

import { DealCard } from "@/components/deals/deal-card";
import type { ExchangeRateQuote, SearchResult } from "@/modules/prices/domain/types";

export function GameCard({ game, rate }: { game: SearchResult; rate: ExchangeRateQuote | null }) {
  return (
    <article className="game-card">
      <div className="game-title-row">
        <div className="game-glyph" aria-hidden="true">
          {game.title.slice(0, 1).toUpperCase()}
        </div>
        <div>
          <p>PC hra</p>
          <h2>
            <Link href={`/hra/cheapshark/${game.externalGameId}`}>{game.title}</Link>
          </h2>
        </div>
        <Link className="detail-link" href={`/hra/cheapshark/${game.externalGameId}`}>
          Detail hry →
        </Link>
      </div>
      <div className="deal-list">
        {game.offers.slice(0, 3).map((deal) => (
          <DealCard key={deal.externalOfferId} deal={deal} rate={rate} />
        ))}
      </div>
    </article>
  );
}
