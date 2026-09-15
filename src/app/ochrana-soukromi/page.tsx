export const metadata = { title: "Ochrana soukromí" };
export default function PrivacyPage() {
  return (
    <article className="legal-page shell">
      <p className="eyebrow">Provozní návrh · verze 2026-09-15</p>
      <h1>Zásady ochrany osobních údajů</h1>
      <p>Tento text je základní provozní návrh, nikoliv právní stanovisko.</p>
      <h2>Jaké údaje ukládáme</h2>
      <p>
        Pro účet ukládáme normalizovaný e-mail, bezpečný hash hesla spravovaný Better Auth,
        sessions, nastavení, seznam přání, cenová pravidla, upozornění a evidenci důležitých
        souhlasů. Heslo v čitelné podobě nikdy neukládáme.
      </p>
      <h2>Proč údaje používáme</h2>
      <p>
        Údaje používáme k přihlášení, ochraně účtu a poskytnutí funkcí, které si uživatel zapne.
        Marketingový souhlas je samostatný a při registraci není předem udělen.
      </p>
      <h2>Cookies</h2>
      <p>
        Používáme pouze nezbytnou bezpečnou session cookie. Reklamní a analytické cookies jsou
        vypnuté.
      </p>
      <h2>Vaše možnosti</h2>
      <p>
        V nastavení lze stáhnout základní export, změnit marketingový souhlas nebo účet včetně
        osobních seznamů smazat.
      </p>
      <h2>E-mail a Steam</h2>
      <p>
        E-mailové doručování je ve výchozím stavu vypnuté. Steam propojení je pouze datově
        připravené; nepoužíváme scraping ani soukromé endpointy.
      </p>
    </article>
  );
}
