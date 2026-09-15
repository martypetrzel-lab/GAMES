import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";

import { WishlistButton } from "@/components/accounts/wishlist-button";
import { DealCard } from "@/components/deals/deal-card";
import { RateNote } from "@/components/deals/rate-note";
import { SearchForm } from "@/components/games/search-form";
import { buildGameMetadata } from "@/modules/catalog/metadata";
import { getStoredUsdCzkRate } from "@/modules/prices/services/exchange-rate-service";
import { getGamePriceOverview } from "@/modules/prices/services/history-service";
import {
  getStoredGameBySlug,
  mapStoredDetail,
} from "@/modules/prices/services/public-catalog-service";
import { convertUsdCentsToCzkHalere, formatMoney } from "@/lib/money/money";
import { isPriceStale, relativeUpdateLabel } from "@/modules/prices/domain/freshness";

const PriceHistoryChart = dynamic(() =>
  import("@/components/charts/price-history-chart").then((module) => module.PriceHistoryChart),
);

export async function generateMetadata({ params }: PageProps<"/hra/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const game = await getStoredGameBySlug(slug);
  return game
    ? buildGameMetadata(game)
    : { title: "Hra nebyla nalezena", robots: { index: false } };
}

export default async function CanonicalGamePage({ params }: PageProps<"/hra/[slug]">) {
  const { slug } = await params;
  const stored = await getStoredGameBySlug(slug);
  if (!stored) notFound();
  if (stored.slug !== slug) permanentRedirect(`/hra/${stored.slug}`);
  const detail = mapStoredDetail(stored);
  if (!detail.game.externalGameId || detail.offers.length === 0) notFound();

  const [rate, summary] = await Promise.all([
    getStoredUsdCzkRate(),
    getGamePriceOverview(detail.game.externalGameId),
  ]);
  const best = detail.offers[0];
  const bestCzk = rate ? convertUsdCentsToCzkHalere(best.price.minor, rate.rate) : null;
  const stale = isPriceStale(best.observedAt);
  const canonicalUrl = `/hra/${stored.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: detail.game.title,
    image: detail.game.imageUrl || undefined,
    category: detail.internal.productType === "GAME" ? "VideoGame" : detail.internal.productType,
    url: canonicalUrl,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: best.price.currency,
      lowPrice: (best.price.minor / 100).toFixed(2),
      offerCount: detail.offers.length,
      availability: "https://schema.org/InStock",
    },
  };

  return (
    <section className="game-detail shell">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />
      <SearchForm defaultValue={detail.game.title} />
      <article className="detail-hero">
        <div className="detail-cover">
          {detail.game.imageUrl ? (
            <Image
              src={detail.game.imageUrl}
              alt={`Obrázek hry ${detail.game.title}`}
              fill
              sizes="(max-width: 700px) 100vw, 360px"
              priority
            />
          ) : (
            <span>{detail.game.title.slice(0, 1)}</span>
          )}
        </div>
        <div className="detail-summary">
          <p className="kicker">
            {detail.internal.productType === "GAME" ? "Plná PC hra" : detail.internal.productType} ·
            uložená data
          </p>
          <h1>{detail.game.title}</h1>
          <div className="hero-price">
            <span>Nejlepší poslední známá cena</span>
            <strong>
              {bestCzk === null
                ? formatMoney(best.price)
                : formatMoney({ minor: bestCzk, currency: "CZK" })}
            </strong>
            <small>Přesně {formatMoney(best.price)}</small>
          </div>
          <div className="hero-facts">
            <span>
              <b>{best.savingsPercent} %</b> sleva
            </span>
            <span>
              <b>{best.storeName}</b> nejlevnější obchod
            </span>
            <span className={stale ? "stale-price" : undefined}>
              <b>Aktualizováno {relativeUpdateLabel(best.observedAt)}</b>
              {stale ? " · starší cena" : ""}
            </span>
          </div>
          {best.persistedId && (
            <a
              className="button hero-buy"
              href={`/go/${best.persistedId}`}
              target="_blank"
              rel="nofollow sponsored noopener"
            >
              Přejít do obchodu ↗
            </a>
          )}
          <WishlistButton externalGameId={detail.game.externalGameId} returnTo={canonicalUrl} />
        </div>
      </article>
      <RateNote rate={rate} />
      {stale && (
        <aside className="external-history">
          <strong>Cena může být zastaralá</strong>
          <p>
            Zobrazujeme poslední skutečně uložený údaj. Aktualizace probíhá odděleně a výpadek
            zdroje nezablokuje tuto stránku.
          </p>
        </aside>
      )}
      <section className="stats-grid" aria-label="Statistiky vlastní cenové historie">
        <Stat label="Aktuální nejlepší cena" value={formatMoney(best.price)} />
        <Stat
          label="Vlastní historické minimum"
          value={summary ? formatMoney({ minor: summary.minimum, currency: "USD" }) : "—"}
        />
        <Stat
          label="Průměrná cena"
          value={summary ? formatMoney({ minor: summary.average, currency: "USD" }) : "—"}
        />
        <Stat label="Cenových pozorování" value={String(summary?.count ?? 0)} />
      </section>
      <PriceHistoryChart gameId={detail.game.externalGameId} rate={rate?.rate ?? null} />
      <section className="detail-offers">
        <div className="panel-heading">
          <div>
            <p className="kicker">Poslední uložené údaje</p>
            <h2>Všechny nabídky</h2>
          </div>
          <span>{detail.offers.length} nabídek</span>
        </div>
        <div className="deal-list">
          {detail.offers.map((deal) => (
            <DealCard key={deal.externalOfferId} deal={deal} rate={rate} />
          ))}
        </div>
      </section>
    </section>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <article className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </article>
  );
}
