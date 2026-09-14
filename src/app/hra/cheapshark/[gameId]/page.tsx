import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { DealCard } from "@/components/deals/deal-card";
import { RateNote } from "@/components/deals/rate-note";
import { SearchForm } from "@/components/games/search-form";
import { formatMoney } from "@/lib/money/money";
import { getUsdCzkRate } from "@/modules/prices/services/exchange-rate-service";
import { getGameDetail } from "@/modules/prices/services/price-service";

export async function generateMetadata({
  params,
}: PageProps<"/hra/cheapshark/[gameId]">): Promise<Metadata> {
  const { gameId } = await params;
  return { title: `Detail hry ${gameId}` };
}

export default async function GameDetailPage({ params }: PageProps<"/hra/cheapshark/[gameId]">) {
  const { gameId } = await params;
  const [detail, rate] = await Promise.all([getGameDetail(gameId), getUsdCzkRate()]);
  if (!detail) notFound();
  const historicalDate = detail.game.externalHistoricalLowAt
    ? new Intl.DateTimeFormat("cs-CZ").format(detail.game.externalHistoricalLowAt)
    : null;

  return (
    <section className="game-detail shell">
      <div className="detail-top">
        <div className="game-glyph game-glyph-large">{detail.game.title.slice(0, 1)}</div>
        <div>
          <p className="kicker">PC hra · data CheapShark</p>
          <h1>{detail.game.title}</h1>
          {detail.game.steamAppId && (
            <p className="steam-id">Steam App ID: {detail.game.steamAppId}</p>
          )}
        </div>
      </div>
      <SearchForm defaultValue={detail.game.title} />
      <RateNote rate={rate} />
      {detail.game.externalHistoricalLow && (
        <aside className="external-history">
          <strong>Externí historický údaj CheapShark</strong>
          <span>
            {formatMoney(detail.game.externalHistoricalLow)}
            {historicalDate ? ` · ${historicalDate}` : ""}
          </span>
          <p>Nejde o vlastní cenovou historii GameRadar CZ.</p>
        </aside>
      )}
      <div className="detail-offers">
        <div className="section-heading">
          <p>Aktuální nabídky</p>
          <h2>Porovnání obchodů</h2>
        </div>
        <div className="deal-list">
          {detail.offers.map((deal) => (
            <DealCard key={deal.externalOfferId} deal={deal} rate={rate} />
          ))}
        </div>
      </div>
    </section>
  );
}
