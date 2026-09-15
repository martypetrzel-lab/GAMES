import Image from "next/image";
import Link from "next/link";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getWishlist } from "@/modules/accounts/account-data";
import { removeFromWishlist, updateWishlist } from "@/modules/accounts/wishlist-actions";

export const metadata = { title: "Seznam přání", robots: { index: false, follow: false } };
export default async function WishlistPage() {
  await connection();
  const user = await requireUser("/seznam-prani");
  const items = await getWishlist(user.id);
  return (
    <section className="account-dashboard shell">
      <p className="eyebrow">Moje hry</p>
      <h1>Seznam přání</h1>
      {items.length === 0 ? (
        <div className="empty-onboarding">
          <h2>Zatím je tu prázdno</h2>
          <p>Přidejte hru z vyhledávání, detailu nebo titulní stránky.</p>
          <Link className="button-primary" href="/hledat">
            Najít hru
          </Link>
        </div>
      ) : (
        <div className="wishlist-list">
          {items.map((item) => {
            const offer = item.game.offers[0],
              alert = item.alerts[0];
            const external = item.game.providerGames[0]?.externalId;
            return (
              <article key={item.id}>
                {item.game.imageUrl && (
                  <Image src={item.game.imageUrl} alt="" width={160} height={90} />
                )}
                <div>
                  <h2>
                    {external ? (
                      <Link href={`/hra/cheapshark/${external}`}>{item.game.title}</Link>
                    ) : (
                      item.game.title
                    )}
                  </h2>
                  <p>
                    Aktuálně {offer ? `$${(offer.priceMinor / 100).toFixed(2)}` : "bez ceny"} · při
                    přidání{" "}
                    {item.priceAtAddMinor
                      ? `$${(item.priceAtAddMinor / 100).toFixed(2)}`
                      : "nezaznamenáno"}
                  </p>
                  <form action={updateWishlist}>
                    <input type="hidden" name="wishlistId" value={item.id} />
                    <label>
                      Poznámka
                      <input name="note" defaultValue={item.note ?? ""} maxLength={500} />
                    </label>
                    <label>
                      Cílová cena v CZK
                      <input
                        name="targetPrice"
                        inputMode="decimal"
                        defaultValue={
                          alert?.targetPriceMinor ? (alert.targetPriceMinor / 100).toFixed(2) : ""
                        }
                      />
                    </label>
                    <label className="check-row">
                      <input
                        type="checkbox"
                        name="enabled"
                        defaultChecked={alert?.enabled ?? true}
                      />{" "}
                      Upozornění aktivní
                    </label>
                    <button className="button-secondary">Uložit</button>
                  </form>
                  <form action={removeFromWishlist}>
                    <input type="hidden" name="wishlistId" value={item.id} />
                    <button className="text-danger">Odebrat</button>
                  </form>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}
