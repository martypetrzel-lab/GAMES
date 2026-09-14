export default function Loading() {
  return (
    <section className="search-page shell" aria-label="Načítáme výsledky">
      <div className="skeleton skeleton-heading" />
      <div className="skeleton skeleton-search" />
      {[1, 2, 3].map((item) => (
        <div className="skeleton skeleton-card" key={item} />
      ))}
    </section>
  );
}
