"use client";

export default function SearchError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <section className="error-state shell">
      <span>!</span>
      <p className="kicker">Něco se nepovedlo</p>
      <h1>Nabídky se nepodařilo načíst</h1>
      <p>Zdroj cen nebo databáze jsou dočasně nedostupné. Zkuste to prosím znovu.</p>
      <button onClick={reset}>Zkusit znovu</button>
    </section>
  );
}
