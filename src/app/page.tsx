import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";

import { AdSlot } from "@/components/ads/ad-slot";
import { SearchForm } from "@/components/games/search-form";
import { formatMoney } from "@/lib/money/money";
import { getHomeHighlights } from "@/modules/prices/services/home-service";
import { WishlistButton } from "@/components/accounts/wishlist-button";

const benefits = [
  {
    number: "01",
    title: "Aktuální nabídky",
    text: "Porovnáváme ceny digitálních PC her z ověřeného cenového zdroje.",
  },
  {
    number: "02",
    title: "Český přepočet",
    text: "Orientační ceny v korunách počítáme podle oficiálního kurzu ČNB.",
  },
  {
    number: "03",
    title: "Vlastní historie",
    text: "Cenová pozorování ukládáme při skutečné změně a nesimulujeme chybějící data.",
  },
];

export default async function Home() {
  await connection();
  const highlights = await getHomeHighlights().catch(() => ({
    interesting: [],
    discounts: [],
    recentQueries: [],
  }));
  return (
    <>
      <section className="hero shell">
        <div className="eyebrow">
          <span /> Český srovnávač cen PC her
        </div>
        <h1>
          Dobrá hra.
          <br />
          <em>Lepší cena.</em>
        </h1>
        <p className="hero-copy">
          Aktuální nabídky digitálních obchodů, transparentní cenová historie a orientační přepočet
          do korun na jednom místě.
        </p>
        <SearchForm size="large" />
        <p className="search-hint">
          Zkuste třeba <Link href="/hledat?q=Cyberpunk">Cyberpunk</Link>,{" "}
          <Link href="/hledat?q=Witcher">Witcher</Link> nebo{" "}
          <Link href="/hledat?q=Elden+Ring">Elden Ring</Link>.
        </p>
        <AdSlot placement="home-hero" />
      </section>
      {highlights.interesting.length > 0 && (
        <OfferSection
          title="Aktuálně zajímavé nabídky"
          kicker="Nízké aktuální ceny"
          offers={highlights.interesting}
        />
      )}
      {highlights.discounts.length > 0 && (
        <OfferSection
          title="Největší uložené slevy"
          kicker="Z vlastní databáze"
          offers={highlights.discounts}
        />
      )}
      {highlights.recentQueries.length > 0 && (
        <section className="recent-searches shell">
          <div className="section-heading">
            <p>Co se hledalo</p>
            <h2>Nedávná vyhledávání</h2>
          </div>
          <div>
            {highlights.recentQueries.map((query) => (
              <Link key={query} href={`/hledat?q=${encodeURIComponent(query)}`}>
                {query} →
              </Link>
            ))}
          </div>
        </section>
      )}
      <section className="benefits shell" aria-labelledby="why-title">
        <div className="section-heading">
          <p>Jak to funguje</p>
          <h2 id="why-title">Jasná data, žádná vymyšlená historie</h2>
        </div>
        <div className="benefit-grid">
          {benefits.map((benefit) => (
            <article className="benefit-card" key={benefit.number}>
              <span>{benefit.number}</span>
              <h3>{benefit.title}</h3>
              <p>{benefit.text}</p>
            </article>
          ))}
        </div>
        <p className="conversion-note">
          Ceny v CZK jsou orientační. Přepočet používá poslední dostupný kurz ČNB; přesná cena v USD
          zůstává vždy uvedena.
        </p>
      </section>
    </>
  );
}

type HomeOffer = Awaited<ReturnType<typeof getHomeHighlights>>["interesting"][number];
function OfferSection({
  title,
  kicker,
  offers,
}: {
  title: string;
  kicker: string;
  offers: HomeOffer[];
}) {
  return (
    <section className="home-offers shell">
      <div className="section-heading">
        <p>{kicker}</p>
        <h2>{title}</h2>
      </div>
      <div className="offer-grid">
        {offers.map((offer) => {
          const externalId = offer.game.providerGames[0]?.externalId ?? "";
          return (
            <article className="offer-tile" key={offer.id}>
              <Link href={`/hra/cheapshark/${externalId}`}>
                <div className="offer-image">
                  {offer.game.imageUrl ? (
                    <Image src={offer.game.imageUrl} alt="" fill sizes="280px" />
                  ) : (
                    <span>{offer.game.title.slice(0, 1)}</span>
                  )}
                </div>
                <div>
                  <h3>{offer.game.title}</h3>
                  <p>{offer.store.name}</p>
                  <strong>{formatMoney({ minor: offer.priceMinor, currency: "USD" })}</strong>
                  {offer.savingsPercent > 0 && <b>−{offer.savingsPercent} %</b>}
                </div>
              </Link>
              <WishlistButton externalGameId={externalId} returnTo="/" />
            </article>
          );
        })}
      </div>
    </section>
  );
}
