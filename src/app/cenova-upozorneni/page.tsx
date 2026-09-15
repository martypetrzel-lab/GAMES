import Link from "next/link";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getWishlist } from "@/modules/accounts/account-data";
export const metadata = { title: "Cenová upozornění", robots: { index: false, follow: false } };
export default async function AlertsPage() {
  await connection();
  const user = await requireUser("/cenova-upozorneni");
  const items = await getWishlist(user.id);
  return (
    <section className="account-dashboard shell">
      <p className="eyebrow">Hlídání ceny</p>
      <h1>Cenová upozornění</h1>
      <p>CZK ceny jsou orientační přepočet z USD podle uloženého kurzu ČNB.</p>
      <div className="simple-list">
        {items
          .filter((i) => i.alerts.length)
          .map((i) => (
            <Link key={i.id} href="/seznam-prani">
              <strong>{i.game.title}</strong>
              <span>
                {i.alerts[0].targetPriceMinor
                  ? `Cíl ${(i.alerts[0].targetPriceMinor! / 100).toFixed(2)} Kč`
                  : "Nové historické minimum"}
              </span>
            </Link>
          ))}
      </div>
      {!items.some((i) => i.alerts.length) && (
        <div className="empty-onboarding">
          <h2>Žádné aktivní upozornění</h2>
          <p>Cílovou cenu nastavíte u hry v seznamu přání.</p>
          <Link className="button-primary" href="/seznam-prani">
            Otevřít seznam přání
          </Link>
        </div>
      )}
    </section>
  );
}
