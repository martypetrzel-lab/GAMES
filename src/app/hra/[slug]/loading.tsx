export default function LoadingGame() {
  return (
    <section className="game-detail shell" aria-label="Načítáme detail hry">
      <div className="skeleton skeleton-search" />
      <div className="skeleton detail-hero" />
    </section>
  );
}
