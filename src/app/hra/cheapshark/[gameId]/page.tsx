import type { Metadata } from "next";
import dynamic from "next/dynamic";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";

import { DealCard } from "@/components/deals/deal-card";
import { RateNote } from "@/components/deals/rate-note";
import { SearchForm } from "@/components/games/search-form";
import { WishlistButton } from "@/components/accounts/wishlist-button";
import { getPrisma } from "@/lib/db/prisma";
import { convertUsdCentsToCzkHalere, formatMoney } from "@/lib/money/money";
import { priceRatingLabels, ratePrice } from "@/modules/prices/domain/price-analytics";
import { getUsdCzkRate } from "@/modules/prices/services/exchange-rate-service";
import { getGamePriceSummary } from "@/modules/prices/services/history-service";
import { getGameDetail } from "@/modules/prices/services/price-service";
import { canonicalGamePath, legacyCheapSharkRedirect } from "@/modules/catalog/legacy-routing";
import { getCanonicalSlugForProvider } from "@/modules/prices/services/public-catalog-service";

const PriceHistoryChart = dynamic(() =>
  import("@/components/charts/price-history-chart").then((module) => module.PriceHistoryChart),
);

export async function generateMetadata({
  params,
}: PageProps<"/hra/cheapshark/[gameId]">): Promise<Metadata> {
  const { gameId } = await params;
  const record = await getPrisma().providerGame.findUnique({
    where: { provider_externalId: { provider: "cheapshark", externalId: gameId } },
    select: { game: { select: { title: true, slug: true, imageUrl: true } } },
  });
  const title = record?.game.title ?? `PC hra ${gameId}`;
  const description = `Aktuální nabídky, cenová historie a porovnání cen hry ${title} v českých korunách.`;
  const path = record ? canonicalGamePath(record.game.slug) : `/hra/cheapshark/${gameId}`;
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      title,
      description,
      type: "website",
      url: path,
      images: record?.game.imageUrl ? [record.game.imageUrl] : undefined,
    },
  };
}

export default async function GameDetailPage({ params }: PageProps<"/hra/cheapshark/[gameId]">) {
  const { gameId } = await params;
  const redirectPath = legacyCheapSharkRedirect(
    await getCanonicalSlugForProvider("cheapshark", gameId),
  );
  if (redirectPath) permanentRedirect(redirectPath);
  const detail = await getGameDetail(gameId);
  if (!detail || detail.offers.length === 0) notFound();
  const [rate, summary] = await Promise.all([getUsdCzkRate(), getGamePriceSummary(gameId)]);
  const best = detail.offers[0];
  const bestCzk = rate ? convertUsdCentsToCzkHalere(best.price.minor, rate.rate) : null;
  const rating = ratePrice(best.price.minor, summary);
  const steamUrl = detail.game.steamAppId
    ? `https://store.steampowered.com/app/${detail.game.steamAppId}`
    : null;
  const formatOwn = (minor?: number) =>
    minor === undefined ? "—" : formatMoney({ minor, currency: "USD" });
  const historicalDate = detail.game.externalHistoricalLowAt
    ? new Intl.DateTimeFormat("cs-CZ").format(detail.game.externalHistoricalLowAt)
    : null;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: detail.game.title,
    image: detail.game.imageUrl || undefined,
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "USD",
      lowPrice: (best.price.minor / 100).toFixed(2),
      offerCount: detail.offers.length,
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
          <p className="kicker">PC hra · data CheapShark</p>
          <h1>{detail.game.title}</h1>
          <div className="detail-identifiers">
            {detail.game.steamAppId && <span>Steam App ID {detail.game.steamAppId}</span>}
            {steamUrl && (
              <a href={steamUrl} target="_blank" rel="noopener noreferrer">
                Oficiální stránka na Steamu ↗
              </a>
            )}
          </div>
          <div className="hero-price">
            <span>Nejlepší aktuální cena</span>
            <strong>
              {bestCzk === null
                ? formatMoney(best.price)
                : formatMoney({ minor: bestCzk, currency: "CZK" })}
            </strong>
            <small>
              Přesně {formatMoney(best.price)}{" "}
              {best.regularPrice.minor > best.price.minor && (
                <>
                  · původně <s>{formatMoney(best.regularPrice)}</s>
                </>
              )}
            </small>
          </div>
          <div className="hero-facts">
            <span>
              <b>{best.savingsPercent} %</b> sleva
            </span>
            <span>
              <b>{best.storeName}</b> nejlevnější obchod
            </span>
            <span>
              <b>
                {new Intl.DateTimeFormat("cs-CZ", {
                  dateStyle: "medium",
                  timeStyle: "short",
                }).format(best.observedAt)}
              </b>{" "}
              poslední kontrola
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
          <WishlistButton externalGameId={gameId} returnTo={`/hra/cheapshark/${gameId}`} />
        </div>
      </article>
      <RateNote rate={rate} />
      <aside className="trusted-store-note">
        <strong>Co znamená ověřený obchod?</strong>
        <p>
          Nabídky zobrazujeme jen z přímých platforem nebo ručně schválených autorizovaných
          prodejců. Obchod a aktivační platforma jsou dvě různé informace; neznámou aktivaci
          neodhadujeme.
        </p>
      </aside>
      <section className="stats-grid" aria-label="Statistiky vlastní cenové historie">
        <Stat label="Aktuální nejlepší cena" value={formatOwn(best.price.minor)} />
        <Stat label="Vlastní historické minimum" value={formatOwn(summary?.minimum)} />
        <Stat label="Nejvyšší zaznamenaná cena" value={formatOwn(summary?.maximum)} />
        <Stat label="Průměrná cena" value={formatOwn(summary?.average)} />
        <Stat label="Medián ceny" value={formatOwn(summary?.median)} />
        <Stat
          label="Rozdíl od minima"
          value={
            summary
              ? `${Math.round(((best.price.minor - summary.minimum) / summary.minimum) * 100)} %`
              : "—"
          }
        />
        <Stat label="Cenových pozorování" value={String(summary?.count ?? 0)} />
        <Stat
          label="Období sledování"
          value={
            summary
              ? `${new Intl.DateTimeFormat("cs-CZ").format(summary.firstObservedAt)} – ${new Intl.DateTimeFormat("cs-CZ").format(summary.lastObservedAt)}`
              : "Teprve začíná"
          }
        />
      </section>
      <aside className={`price-rating rating-${rating}`}>
        <div>
          <span>Hodnocení aktuální ceny</span>
          <strong>{priceRatingLabels[rating]}</strong>
        </div>
        <p>
          Hodnotíme pouze vlastní historii s alespoň 5 záznamy za minimálně 14 dní. Kratší sledování
          nepovažujeme za obvyklou tržní cenu.
        </p>
      </aside>
      {detail.game.externalHistoricalLow && (
        <aside className="external-history">
          <strong>Historické minimum podle externího zdroje</strong>
          <span>
            {formatMoney(detail.game.externalHistoricalLow)}
            {historicalDate ? ` · ${historicalDate}` : ""}
          </span>
          <p>
            Tento údaj pochází z CheapSharku a není součástí vlastní cenové historie GameRadar CZ.
          </p>
        </aside>
      )}
      <PriceHistoryChart gameId={gameId} rate={rate?.rate ?? null} />
      <section className="detail-offers">
        <div className="panel-heading">
          <div>
            <p className="kicker">Aktuálně dostupné</p>
            <h2>Všechny nabídky</h2>
          </div>
          <span>{detail.offers.length} nabídek</span>
        </div>
        <div className="offers-heading" aria-hidden="true">
          <span>Obchod a aktivace</span>
          <span>Cena</span>
          <span>Sleva</span>
          <span>Aktualizace</span>
          <span>Odkaz</span>
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
