import Link from "next/link";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getDashboard } from "@/modules/accounts/account-data";

export const metadata = { title: "Můj přehled", robots: { index: false, follow: false } };
export default async function DashboardPage() {
  await connection();
  const user = await requireUser("/muj-prehled");
  const data = await getDashboard(user.id);
  return (
    <section className="account-dashboard shell">
      <p className="eyebrow">Osobní centrum</p>
      <h1>Můj přehled</h1>
      <div className="account-stats">
        <article>
          <strong>{data.wishlist.length}</strong>
          <span>sledovaných her</span>
        </article>
        <article>
          <strong>{data.activeAlerts}</strong>
          <span>aktivních upozornění</span>
        </article>
        <article>
          <strong>{data.unread.length}</strong>
          <span>nepřečtených zpráv</span>
        </article>
      </div>
      {data.wishlist.length === 0 ? (
        <div className="empty-onboarding">
          <h2>Začněte první sledovanou hrou</h2>
          <p>
            Vyhledejte hru, otevřete její detail a přidejte ji do seznamu přání. Potom můžete
            nastavit cílovou cenu.
          </p>
          <Link className="button-primary" href="/hledat">
            Vyhledat hru
          </Link>
        </div>
      ) : (
        <>
          <h2>Poslední sledované hry</h2>
          <div className="simple-list">
            {data.wishlist.slice(0, 5).map((item) => (
              <Link
                key={item.id}
                href={`/hra/cheapshark/${item.game.providerGames[0]?.externalId}`}
              >
                {item.game.title}
                <span>
                  {item.game.offers[0]
                    ? `$${(item.game.offers[0].priceMinor / 100).toFixed(2)}`
                    : "Cena není dostupná"}
                </span>
              </Link>
            ))}
          </div>
        </>
      )}
    </section>
  );
}
