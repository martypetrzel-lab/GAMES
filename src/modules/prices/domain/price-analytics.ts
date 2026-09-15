export type PriceSummary = Readonly<{
  count: number;
  minimum: number;
  maximum: number;
  average: number;
  median: number;
  firstObservedAt: Date;
  lastObservedAt: Date;
}>;

export type PriceRating =
  "historical-low" | "excellent" | "good" | "usual" | "above-usual" | "insufficient-data";

export function summarizePrices(
  observations: ReadonlyArray<{ priceMinor: number; observedAt: Date }>,
): PriceSummary | null {
  if (observations.length === 0) return null;
  const prices = observations.map((item) => item.priceMinor).sort((a, b) => a - b);
  const dates = observations.map((item) => item.observedAt.getTime()).sort((a, b) => a - b);
  const middle = Math.floor(prices.length / 2);
  const median =
    prices.length % 2 === 0
      ? Math.round((prices[middle - 1] + prices[middle]) / 2)
      : prices[middle];

  return {
    count: prices.length,
    minimum: prices[0],
    maximum: prices[prices.length - 1],
    average: Math.round(prices.reduce((sum, price) => sum + price, 0) / prices.length),
    median,
    firstObservedAt: new Date(dates[0]),
    lastObservedAt: new Date(dates[dates.length - 1]),
  };
}

export function ratePrice(currentPriceMinor: number, summary: PriceSummary | null): PriceRating {
  if (!summary) return "insufficient-data";
  const trackedDays =
    (summary.lastObservedAt.getTime() - summary.firstObservedAt.getTime()) / 86_400_000;
  if (summary.count < 5 || trackedDays < 14) return "insufficient-data";
  if (currentPriceMinor <= summary.minimum) return "historical-low";
  const ratio = currentPriceMinor / summary.median;
  if (ratio <= 0.8) return "excellent";
  if (ratio <= 0.95) return "good";
  if (ratio <= 1.1) return "usual";
  return "above-usual";
}

export const priceRatingLabels: Record<PriceRating, string> = {
  "historical-low": "Historické minimum",
  excellent: "Výborná cena",
  good: "Dobrá cena",
  usual: "Běžná cena",
  "above-usual": "Nad obvyklou cenou",
  "insufficient-data": "Zatím nedostatek dat",
};
