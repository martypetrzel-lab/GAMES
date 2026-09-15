import Image from "next/image";
import Link from "next/link";
import { getPrisma } from "@/lib/db/prisma";
import { unstable_cache } from "next/cache";

export const dynamic = "force-dynamic";

const getFreeOffers = unstable_cache(
  () =>
    getPrisma().offer.findMany({
      where: {
        priceMinor: 0,
        store: { isActive: true, trustStatus: "verified" },
        game: {
          catalogActive: true,
          providerGames: { some: { provider: "cheapshark" } },
          OR: [{ productTypeOverride: "GAME" }, { productTypeOverride: null, productType: "GAME" }],
        },
      },
      orderBy: { observedAt: "desc" },
      take: 50,
      select: {
        id: true,
        store: { select: { name: true } },
        game: { select: { slug: true, title: true, imageUrl: true } },
      },
    }),
  ["free-games-v2"],
  { revalidate: 600, tags: ["free-games", "public-offers"] },
);

export const metadata = {
  title: "Hry zdarma",
  description: "Potvrzené aktuální nabídky PC her s nulovou cenou.",
};
export default async function FreeGamesPage() {
  const offers = await getFreeOffers();
  return (
    <section className="account-dashboard shell">
      <p className="eyebrow">Ověřené nulové ceny</p>
      <h1>Hry zdarma</h1>
      <p>
        Zobrazujeme pouze nabídky, u kterých současný zdroj skutečně uvádí cenu 0. CheapShark
        spolehlivě nerozlišuje trvale bezplatnou hru, bezplatný víkend, demo a dočasnou akci, proto
        typ ani konec akce neodhadujeme.
      </p>
      {offers.length === 0 ? (
        <div className="empty-onboarding">
          <h2>Právě nemáme potvrzenou nulovou nabídku</h2>
          <p>Stránku průběžně doplní běžné kontroly cen.</p>
        </div>
      ) : (
        <div className="free-grid">
          {offers.map((o) => (
            <article key={o.id}>
              {o.game.imageUrl && <Image src={o.game.imageUrl} alt="" width={240} height={135} />}
              <h2>{o.game.title}</h2>
              <p>{o.store.name} · zdroj CheapShark</p>
              <strong>0 Kč / 0 USD</strong>
              <Link href={`/hra/${o.game.slug}`}>Zobrazit detail</Link>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
