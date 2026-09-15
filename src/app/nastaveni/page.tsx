import { requireUser } from "@/lib/auth/session";
import { connection } from "next/server";
import { getPrisma } from "@/lib/db/prisma";
import { deleteAccount, updatePrivacySettings } from "@/modules/accounts/account-actions";
export const metadata = { title: "Nastavení účtu", robots: { index: false, follow: false } };
export default async function SettingsPage() {
  await connection();
  const user = await requireUser("/nastaveni");
  const record = await getPrisma().user.findUniqueOrThrow({ where: { id: user.id } });
  return (
    <section className="account-dashboard shell">
      <p className="eyebrow">Soukromí a účet</p>
      <h1>Nastavení</h1>
      <p>Přihlášený e-mail: {record.email}</p>
      <form className="settings-card" action={updatePrivacySettings}>
        <label className="check-row">
          <input type="checkbox" name="marketingEmails" defaultChecked={record.marketingEmails} />{" "}
          Chci dostávat marketingové e-maily
        </label>
        <p>Transakční zprávy o účtu a vámi nastavených cenách jsou spravovány odděleně.</p>
        <button className="button-secondary">Uložit nastavení</button>
      </form>
      <a className="button-secondary" href="/api/account/export">
        Stáhnout moje data
      </a>
      <form className="danger-zone" action={deleteAccount}>
        <h2>Smazání účtu</h2>
        <p>Trvale odstraní účet, sessions, seznam přání a osobní upozornění.</p>
        <button className="text-danger">Trvale smazat účet</button>
      </form>
    </section>
  );
}
