export function hasRelevantPriceChange(
  latest: { priceMinor: number; regularPriceMinor: number; currency: string } | null,
  next: { priceMinor: number; regularPriceMinor: number; currency: string },
) {
  return (
    !latest ||
    latest.priceMinor !== next.priceMinor ||
    latest.regularPriceMinor !== next.regularPriceMinor ||
    latest.currency !== next.currency
  );
}
