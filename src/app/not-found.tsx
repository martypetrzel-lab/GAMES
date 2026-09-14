import Link from "next/link";

export default function NotFound() {
  return (
    <section className="error-state shell">
      <span>404</span>
      <p className="kicker">Stránka nenalezena</p>
      <h1>Tahle hra se nám schovala</h1>
      <p>Odkaz už nemusí být platný nebo hra v katalogu neexistuje.</p>
      <Link className="button" href="/">
        Zpět na hlavní stránku
      </Link>
    </section>
  );
}
