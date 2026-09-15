import Link from "next/link";
import Image from "next/image";

import { convertUsdCentsToCzkHalere, formatMoney } from "@/lib/money/money";
import type { ExchangeRateQuote, SearchResult } from "@/modules/prices/domain/types";
import { WishlistButton } from "@/components/accounts/wishlist-button";

export function GameCard({ game, rate }: { game: SearchResult; rate: ExchangeRateQuote | null }) {
  const best = game.offers[0];
  const czk = rate ? convertUsdCentsToCzkHalere(best.price.minor, rate.rate) : null;
  return (
    <article className="game-card">
      <div className="game-title-row">
        {game.imageUrl ? (
          <Image className="game-cover" src={game.imageUrl} alt="" width={96} height={54} />
        ) : (
          <div className="game-glyph" aria-hidden="true">
            {game.title.slice(0, 1).toUpperCase()}
          </div>
        )}
        <div>
          <p>{game.steamAppId ? "PC hra · Steam ID potvrzeno" : "PC hra"}</p>
          <h2>
            <Link href={`/hra/cheapshark/${game.externalGameId}`}>{game.title}</Link>
          </h2>
        </div>
        <div className="game-best">
          <span>Nejlepší nabídka</span>
          <strong>
            {czk === null ? formatMoney(best.price) : formatMoney({ minor: czk, currency: "CZK" })}
          </strong>
          <small>
            {formatMoney(best.price)} · {best.storeName}
          </small>
        </div>
      </div>
      <div className="game-card-footer">
        <span>
          {game.offers.length} {game.offers.length === 1 ? "nabídka" : "nabídek"} · sleva až{" "}
          {Math.max(...game.offers.map((offer) => offer.savingsPercent))} %
        </span>
        <Link
          className="detail-link button-secondary"
          href={`/hra/cheapshark/${game.externalGameId}`}
        >
          Otevřít detail →
        </Link>
        <WishlistButton
          externalGameId={game.externalGameId}
          returnTo={`/hledat?q=${encodeURIComponent(game.title)}`}
        />
      </div>
    </article>
  );
}
