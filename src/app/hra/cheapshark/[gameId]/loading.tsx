export default function Loading() {
  return (
    <section className="game-detail shell" aria-label="Načítáme detail hry">
      <div className="skeleton skeleton-search" />
      <div className="skeleton detail-hero-skeleton" />
      <div className="stats-grid">
        {Array.from({ length: 8 }, (_, index) => (
          <div className="skeleton stat-card" key={index} />
        ))}
      </div>
      <div className="skeleton chart-loading" />
    </section>
  );
}
