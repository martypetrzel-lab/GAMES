import Link from "next/link";

import { AdSlot } from "@/components/ads/ad-slot";
import { SearchForm } from "@/components/games/search-form";

const benefits = [
  {
    number: "01",
    title: "Ceny na jednom místě",
    text: "Nabídky digitálních PC her přehledně podle ceny.",
  },
  {
    number: "02",
    title: "Český přepočet",
    text: "Orientační ceny v korunách podle oficiálního kurzu ČNB.",
  },
  {
    number: "03",
    title: "Bezpečný odchod",
    text: "Nákupní odkazy vedou přes ověřené přesměrování poskytovatele.",
  },
];

export default function Home() {
  return (
    <>
      <section className="hero shell">
        <div className="eyebrow">
          <span /> Srovnávač cen PC her
        </div>
        <h1>
          Najděte hru.
          <br />
          <em>Ne přeplatek.</em>
        </h1>
        <p className="hero-copy">
          Prohledáme aktuální nabídky digitálních obchodů a ceny přepočítáme orientačně do korun.
        </p>
        <SearchForm size="large" />
        <p className="search-hint">
          Zkuste třeba <Link href="/hledat?q=Cyberpunk">Cyberpunk</Link>,{" "}
          <Link href="/hledat?q=Witcher">Witcher</Link> nebo{" "}
          <Link href="/hledat?q=Elden+Ring">Elden Ring</Link>.
        </p>
        <AdSlot placement="home-hero" />
      </section>
      <section className="benefits shell" aria-labelledby="why-title">
        <div className="section-heading">
          <p>Jak to funguje</p>
          <h2 id="why-title">Rychlé srovnání bez zbytečností</h2>
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
      </section>
    </>
  );
}
