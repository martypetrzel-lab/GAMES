import Link from "next/link";
import { connection } from "next/server";
import { requireUser } from "@/lib/auth/session";
import { getPrisma } from "@/lib/db/prisma";
import {
  markAllNotificationsRead,
  markNotificationRead,
} from "@/modules/accounts/notification-actions";

export const metadata = { title: "Centrum upozornění", robots: { index: false, follow: false } };
export default async function NotificationsPage({ searchParams }: PageProps<"/upozorneni">) {
  await connection();
  const user = await requireUser("/upozorneni");
  const raw = await searchParams;
  const page = Math.max(1, Math.min(1000, Number(raw.page) || 1));
  const take = 20;
  const items = await getPrisma().notification.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    skip: (page - 1) * take,
    take: take + 1,
  });
  const more = items.length > take;
  return (
    <section className="account-dashboard shell">
      <div className="panel-heading">
        <div>
          <p className="eyebrow">Osobní zprávy</p>
          <h1>Centrum upozornění</h1>
        </div>
        <form action={markAllNotificationsRead}>
          <button className="button-secondary">Označit vše jako přečtené</button>
        </form>
      </div>
      {items.length === 0 ? (
        <div className="empty-onboarding">
          <h2>Zatím žádná upozornění</h2>
          <p>Až sledovaná hra dosáhne cílové ceny nebo nového minima, zpráva se objeví zde.</p>
        </div>
      ) : (
        <div className="notification-list">
          {items.slice(0, take).map((item) => (
            <article className={item.readAt ? "" : "unread"} key={item.id}>
              <div>
                <h2>{item.title}</h2>
                <p>{item.message}</p>
                {item.usdPriceMinor != null && (
                  <small>
                    Přesná cena ${(item.usdPriceMinor / 100).toFixed(2)} USD
                    {item.exchangeRateDate
                      ? ` · kurz z ${new Intl.DateTimeFormat("cs-CZ").format(item.exchangeRateDate)}`
                      : ""}
                  </small>
                )}
                <time>
                  {new Intl.DateTimeFormat("cs-CZ", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  }).format(item.createdAt)}
                </time>
              </div>
              <div>
                {item.gameId && (
                  <Link href={`/hledat?q=${encodeURIComponent(item.title)}`}>Otevřít hru</Link>
                )}
                {!item.readAt && (
                  <form action={markNotificationRead}>
                    <input type="hidden" name="notificationId" value={item.id} />
                    <button>Označit jako přečtené</button>
                  </form>
                )}
              </div>
            </article>
          ))}
        </div>
      )}
      <nav className="pagination">
        {page > 1 && <Link href={`/upozorneni?page=${page - 1}`}>← Novější</Link>}
        {more && <Link href={`/upozorneni?page=${page + 1}`}>Starší →</Link>}
      </nav>
    </section>
  );
}
